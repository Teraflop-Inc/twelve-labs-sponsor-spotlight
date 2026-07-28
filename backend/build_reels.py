"""Offline highlight-reel builder → Vercel Blob.

Builds a ~60s MP4 of a brand's top moments per game from the committed analyze
fixtures, then uploads it to Vercel Blob and records the URL in
``demo_fixtures/<game_id>/reels.json`` (see ``reels.py``). We never commit the
binaries or write them at runtime — Vercel's FS is read-only.

Pipeline (per game × brand):
  fixture top-N moments (by confidence × duration, capped at ~30s total)
    → GET /assets/{asset_id} HLS manifest (games registry maps game → asset)
    → FFmpeg ``-ss/-t -c copy`` each clip (±1s pad) to a .ts segment
    → FFmpeg concat demuxer ``-c copy`` → reel.mp4
    → PUT to Vercel Blob → store {url, duration_sec, clips} in reels.json

Usage::

    SPONSOR_SPOTLIGHT_TL_KEY=tlk_... BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... \
        uv run python build_reels.py

Env knobs: SPONSOR_SPOTLIGHT_REEL_BRANDS, SPONSOR_SPOTLIGHT_REEL_GAMES,
SPONSOR_SPOTLIGHT_REEL_MAXSECS (default 60), SPONSOR_SPOTLIGHT_REEL_PAD (default 1),
SPONSOR_SPOTLIGHT_REEL_MAXCLIP (default 0 = no per-clip cap / no truncation).
Requires FFmpeg on PATH (v8.0.1 verified).
"""
from __future__ import annotations

import asyncio
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import httpx

import demo_cache
import games
import jockey
import reels
import weights as ctx_weights

MAX_SECS = float(os.environ.get("SPONSOR_SPOTLIGHT_REEL_MAXSECS", "60"))
PAD = float(os.environ.get("SPONSOR_SPOTLIGHT_REEL_PAD", "1"))
# Per-clip hard cap. 0 (default) = **no cap** → every picked moment plays in
# full (goal celebrations are never truncated). Set a positive value to clip.
MAX_CLIP = float(os.environ.get("SPONSOR_SPOTLIGHT_REEL_MAXCLIP", "0"))
REEL_TOPN = int(os.environ.get("SPONSOR_SPOTLIGHT_REEL_TOPN", "8"))
BLOB_ENDPOINT = "https://blob.vercel-storage.com"

# Reel-only clip-selection weights: goals are cranked far above the tuned
# economics multipliers (weights.CONTEXT_WEIGHTS, goal 3×) so the ~30s sizzle
# clip leads with the goal moments. This override is *editorial* and stays out
# of media-value math — EMV / top-moments still use the 3× table. Tune the goal
# emphasis via SPONSOR_SPOTLIGHT_REEL_GOAL_WEIGHT.
_GOAL_W = float(os.environ.get("SPONSOR_SPOTLIGHT_REEL_GOAL_WEIGHT", "10"))
REEL_WEIGHTS: dict[str, float] = {**ctx_weights.CONTEXT_WEIGHTS, "goal": _GOAL_W, "score": _GOAL_W}


def _key() -> str:
    for var in ("SPONSOR_SPOTLIGHT_TL_KEY", "TWELVELABS_API_KEY", "TWELVE_LABS_API_KEY"):
        v = os.environ.get(var)
        if v:
            return v.strip()
    sys.exit("No TwelveLabs key found. Set SPONSOR_SPOTLIGHT_TL_KEY.")


def _blob_token() -> str:
    for var in ("BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_READ_WRITE_TOKEN"):
        tok = os.environ.get(var)
        if tok:
            return tok.strip()
    sys.exit(
        "No Blob token — export BLOB_READ_WRITE_TOKEN (or VERCEL_BLOB_READ_WRITE_TOKEN)."
    )


def _env_list(name: str) -> list[str]:
    return [s.strip() for s in os.environ.get(name, "").split(",") if s.strip()]


def _rank_moments(brand_entry: dict[str, Any]) -> list[dict[str, Any]]:
    """Top moments for the sizzle reel, ranked **weight-first**.

    Selection is tiered by the reel-only ``REEL_WEIGHTS`` table (goal 10×,
    celebration 2.5×, replay 2×, … wide_shot 1×): a higher-weight tag always
    outranks a lower one, and duration × confidence only breaks ties *within* a
    tier. This is deliberately different from the economics impact score —
    goal board-flashes are short (a 2s goal would lose to a 29s background board
    under weight × duration), so ranking on duration would bury exactly the
    moments the reel exists to show. Weight-first guarantees every goal moment
    makes the reel before any idle exposure fills the leftover budget.
    """
    apps = []
    for m in brand_entry.get("appearances") or []:
        s, e = float(m.get("start_sec") or 0), float(m.get("end_sec") or 0)
        if e <= s:
            continue
        cw = ctx_weights.weight_for_moment(m, REEL_WEIGHTS)
        dur, conf = e - s, float(m.get("confidence") or 0.5)
        apps.append({**m, "_dur": dur, "_w": cw, "_impact": cw * dur * conf, "_tie": dur * conf})
    # Weight tier first, then duration × confidence — goals lead regardless of
    # how briefly the board flashed on screen.
    apps.sort(key=lambda m: (m["_w"], m["_tie"]), reverse=True)
    picked, total = [], 0.0
    for m in apps:
        # Final clip length = full moment ± PAD (no truncation by default so
        # goal celebrations play in full). MAX_CLIP>0 re-enables a hard cap.
        # This is the single source of truth for both the budget and the cut.
        clip = m["_dur"] + 2 * PAD
        m["_clip"] = min(clip, MAX_CLIP) if MAX_CLIP > 0 else clip
        if total + m["_clip"] > MAX_SECS and picked:
            break
        picked.append(m)
        total += m["_clip"]
    # Chronological order in the reel reads better than impact order.
    picked.sort(key=lambda m: float(m.get("start_sec") or 0))
    return picked


def _ffmpeg_cut(hls_url: str, start: float, length: float, out: Path) -> bool:
    """Cut exactly ``length`` seconds at ``start`` (both already padded/capped).

    We **re-encode** rather than ``-c copy``: stream-copy can only cut on keyframes
    / HLS-segment boundaries, which stretched each "8s" clip to ~15s and blew the
    reel past its target. Re-encoding is frame-accurate, so the clip is exactly
    ``length`` and the reel lands at ~MAX_SECS. Uniform codec params also let the
    concat step stay ``-c copy``.
    """
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-ss", f"{max(0.0, start):.2f}", "-i", hls_url, "-t", f"{length:.2f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k", "-ac", "2",
        "-avoid_negative_ts", "make_zero", "-f", "mpegts", str(out),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"    ffmpeg cut failed: {r.stderr.strip()[:200]}", file=sys.stderr)
        return False
    return True


def _probe_duration(path: Path) -> float | None:
    """Actual duration of a media file in seconds (ground truth for metadata)."""
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nk=1:nw=1", str(path)],
        capture_output=True, text=True,
    )
    try:
        return round(float(r.stdout.strip()), 1)
    except ValueError:
        return None


def _ffmpeg_concat(segments: list[Path], out: Path) -> bool:
    listfile = out.with_suffix(".txt")
    listfile.write_text("".join(f"file '{p}'\n" for p in segments))
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
        "-i", str(listfile), "-c", "copy", "-movflags", "+faststart", str(out),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"    ffmpeg concat failed: {r.stderr.strip()[:200]}", file=sys.stderr)
        return False
    return True


def _upload_blob(path: Path, pathname: str) -> str:
    """PUT a file to Vercel Blob; return its public URL."""
    with httpx.Client(timeout=120.0) as client:
        r = client.put(
            f"{BLOB_ENDPOINT}/{pathname}",
            headers={
                "authorization": f"Bearer {_blob_token()}",
                "x-api-version": "7",
                "x-content-type": "video/mp4",
                "x-add-random-suffix": "1",
            },
            content=path.read_bytes(),
        )
    r.raise_for_status()
    return r.json()["url"]


async def build_one(game: dict[str, str], brand: str, workdir: Path) -> None:
    scope = game["id"]
    entry = None
    env = demo_cache.load("analyze", scope) or demo_cache.load("analyze", demo_cache.AGGREGATE)
    for b in (env or {}).get("inventory", {}).get("brands", []):
        if (b.get("name") or "").strip().lower() == brand.strip().lower():
            entry = b
            break
    if not entry:
        print(f"  {scope}/{brand}: no fixture appearances — skip")
        return

    moments = _rank_moments(entry)
    if not moments:
        print(f"  {scope}/{brand}: no usable moments — skip")
        return

    asset = await jockey.get_asset(game["asset_id"])
    hls_url = (asset.get("hls") or {}).get("manifest_url")
    if not hls_url:
        print(f"  {scope}/{brand}: asset has no HLS manifest — skip", file=sys.stderr)
        return

    safe = re.sub(r"[^a-z0-9]+", "-", brand.strip().lower()).strip("-") or "brand"
    segs: list[Path] = []
    cut_secs = 0.0
    for i, m in enumerate(moments):
        seg = workdir / f"{scope}-{safe}-{i}.ts"
        start = float(m["start_sec"]) - PAD  # pad before; length already padded + capped
        if _ffmpeg_cut(hls_url, start, m["_clip"], seg):
            segs.append(seg)
            cut_secs += m["_clip"]
    if not segs:
        print(f"  {scope}/{brand}: all clips failed — skip", file=sys.stderr)
        return

    reel = workdir / f"{scope}-{safe}.mp4"
    if not _ffmpeg_concat(segs, reel):
        return

    url = _upload_blob(reel, f"reels/{scope}/{safe}.mp4")
    dur = _probe_duration(reel) or round(cut_secs, 1)  # ground-truth length
    reels.save(scope, brand, {"url": url, "duration_sec": dur, "clips": len(segs)})
    print(f"  {scope}/{brand}: {len(segs)} clips, {dur:.0f}s → {url}")


async def main_async() -> None:
    jockey.set_api_key(_key())
    _blob_token()  # fail fast if missing

    want_games = _env_list("SPONSOR_SPOTLIGHT_REEL_GAMES") or games.game_ids()
    game_list = [g for g in games.GAMES if g["id"] in want_games]
    brands = _env_list("SPONSOR_SPOTLIGHT_REEL_BRANDS")

    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        for game in game_list:
            # Default to whatever brands the game's analyze fixture already holds.
            env = demo_cache.load("analyze", game["id"])
            game_brands = brands or [
                b.get("name") for b in (env or {}).get("inventory", {}).get("brands", []) if b.get("name")
            ][:REEL_TOPN]  # reels only for the top brands you'd actually pitch
            print(f"\n=== {game['id']} ({game['label']}) — {len(game_brands)} brand(s) ===")
            for brand in game_brands:
                try:
                    await build_one(game, brand, workdir)
                except Exception as e:  # noqa: BLE001 — keep going
                    print(f"  {game['id']}/{brand} failed: {type(e).__name__}: {e}", file=sys.stderr)

    print("\nDone. Reel URLs written to demo_fixtures/<game>/reels.json. Commit them.")


if __name__ == "__main__":
    asyncio.run(main_async())
