"""Stamp committed fixtures with the knowledge store they were captured from.

``services.demo.cache_hit`` refuses to serve a fixture whose recorded
``provenance.store_id`` doesn't match the configured store, so that pointing the
app at a different collection can never return someone else's results. Fixtures
captured before that check existed carry no ``provenance`` block and would be
rejected — this backfills them.

``capture_demo_cache`` stamps new fixtures automatically, so this is only needed
once per pre-existing fixture set. It is idempotent and never overwrites a
store_id that is already recorded.

Usage (from backend/)::

    uv run python -m pre_processing.stamp_fixtures            # dry run
    uv run python -m pre_processing.stamp_fixtures --write    # apply

    # a store other than the configured default:
    uv run python -m pre_processing.stamp_fixtures --write --store-id ks_...
"""
from __future__ import annotations

import argparse
import json
import sys

import demo_cache
from core import config
from domain.sponsor import provenance

# Fixture kinds that flow through the cache check. ``events``/``reels`` are
# capture artifacts read by other paths and don't carry provenance.
STAMPABLE = demo_cache.CACHEABLE


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--write", action="store_true", help="apply changes (default: dry run)")
    ap.add_argument(
        "--store-id",
        default=config.DEMO_STORE_ID,
        help=f"knowledge store these fixtures describe (default: {config.DEMO_STORE_ID})",
    )
    args = ap.parse_args()

    if not demo_cache.FIXTURE_DIR.exists():
        sys.exit(f"No fixture directory at {demo_cache.FIXTURE_DIR}")

    changed = skipped = 0
    for path in sorted(demo_cache.FIXTURE_DIR.rglob("*.json")):
        if path.stem not in STAMPABLE:
            continue
        try:
            envelope = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError) as e:
            print(f"  !! {path}: unreadable ({e})")
            continue

        existing = provenance.store_id_of(envelope)
        if existing:
            skipped += 1
            marker = "==" if existing == args.store_id else "!="
            print(f"  -- {path.relative_to(demo_cache.FIXTURE_DIR)}: already {existing} {marker} target")
            continue

        rel = path.relative_to(demo_cache.FIXTURE_DIR)
        game_id = rel.parent.name
        block = dict(envelope.get(provenance.KEY) or {})
        block.update(
            {
                "source": provenance.SOURCE_LIVE,
                "from_cache": False,
                "store_id": args.store_id,
                "game_id": game_id,
                "provider": provenance.PROVIDER,
                "model": provenance.MODEL,
            }
        )
        block.setdefault("generated_at", None)  # capture time unknown for backfills
        envelope[provenance.KEY] = block

        if args.write:
            path.write_text(json.dumps(envelope, indent=2, ensure_ascii=False) + "\n")
        print(f"  {'++' if args.write else '..'} {rel}: store_id={args.store_id}")
        changed += 1

    verb = "stamped" if args.write else "would stamp"
    print(f"\n{verb} {changed} fixture(s), {skipped} already had one.")
    if changed and not args.write:
        print("Dry run — re-run with --write to apply.")


if __name__ == "__main__":
    main()
