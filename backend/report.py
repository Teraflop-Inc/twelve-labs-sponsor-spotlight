"""Templated performance report (print-to-PDF for the demo).

Renders a self-contained HTML sponsorship report for one brand across one game or
all five. Raw exposure metrics come from the committed analyze/legibility
fixtures; economic figures (weighted media value, ROI) are computed **client-side**
(``lib/econ.ts``) and passed in — the backend never does economics (locked
decision 2026-07-01). Fields with no data are dropped.

This is a sensible default skin; it will be reskinned to Jesse's real template
once it lands (CWORK-1039 open dependency).
"""
from __future__ import annotations

import html
from typing import Any

import weights as ctx_weights


def _fmt_secs(v: Any) -> str:
    try:
        return f"{float(v):.0f}s"
    except (TypeError, ValueError):
        return "—"


def _fmt_money(v: Any) -> str:
    try:
        n = float(v)
    except (TypeError, ValueError):
        return "—"
    return "$" + f"{round(n):,}"


def _fmt_time(sec: Any) -> str:
    try:
        s = int(float(sec))
    except (TypeError, ValueError):
        return "—"
    return f"{s // 60}:{s % 60:02d}"


def _tile(label: str, value: str) -> str:
    return (
        f'<div class="tile"><div class="tile-v">{html.escape(value)}</div>'
        f'<div class="tile-l">{html.escape(label)}</div></div>'
    )


def _top_moments(
    scopes: list[dict[str, Any]],
    limit: int = 8,
    weights: dict[str, float] | None = None,
) -> list[dict[str, Any]]:
    """Rank appearances by monetizable impact = context_weight × duration × confidence.

    Weighting by broadcast context (goal 3×, celebration 2.5×, … wide_shot 1×)
    surfaces the most valuable moments — a logo during a goal outranks a long
    background board. Legibility is deliberately *not* the primary signal.
    """
    moments: list[dict[str, Any]] = []
    for sc in scopes:
        label = sc.get("label", "")
        for m in (sc.get("metrics") or {}).get("appearances") or []:
            dur = max((float(m.get("end_sec") or 0) - float(m.get("start_sec") or 0)), 0.0)
            conf = float(m.get("confidence") or 0.5)
            cw = ctx_weights.weight_for(m.get("context"), weights)
            moments.append({**m, "_game": label, "_impact": cw * dur * conf})
    moments.sort(key=lambda m: m["_impact"], reverse=True)
    return moments[:limit]


def build_report_html(
    brand: str,
    scopes: list[dict[str, Any]],
    *,
    total_media_value: float | None = None,
    generated_note: str = "",
    weights: dict[str, float] | None = None,
) -> str:
    """Assemble the report HTML.

    ``scopes`` = per-game dicts: ``{game_id, label, metrics{...}, avg_legibility,
    media_value}``. ``metrics`` mirrors an analyze-fixture brand entry.
    """
    brand_e = html.escape(brand)
    game_labels = ", ".join(html.escape(s.get("label", "")) for s in scopes) or "All games"

    # Roll-up totals across scopes.
    total_secs = sum(float((s.get("metrics") or {}).get("total_seconds") or 0) for s in scopes)
    total_moments = sum(int((s.get("metrics") or {}).get("moments_count") or 0) for s in scopes)
    total_w2w = sum(
        float((s.get("metrics") or {}).get("outside_whistle_to_whistle_seconds") or 0)
        for s in scopes
    )
    legs = [s["avg_legibility"] for s in scopes if s.get("avg_legibility") is not None]
    avg_leg = sum(legs) / len(legs) if legs else None

    tiles = [
        _tile("Total exposure", _fmt_secs(total_secs)),
        _tile("Moments", str(total_moments)),
        _tile("Outside whistle-to-whistle", _fmt_secs(total_w2w)),
    ]
    if avg_leg is not None:
        tiles.append(_tile("Avg legibility", f"{avg_leg:.1f}/10"))
    if total_media_value is not None:
        tiles.append(_tile("Weighted media value", _fmt_money(total_media_value)))

    # Per-game breakdown rows.
    rows = ""
    for s in scopes:
        m = s.get("metrics") or {}
        leg = s.get("avg_legibility")
        mv = s.get("media_value")
        rows += (
            "<tr>"
            f"<td>{html.escape(s.get('label', ''))}</td>"
            f"<td class='num'>{_fmt_secs(m.get('total_seconds'))}</td>"
            f"<td class='num'>{int(m.get('moments_count') or 0)}</td>"
            f"<td class='num'>{_fmt_secs(m.get('outside_whistle_to_whistle_seconds'))}</td>"
            f"<td class='num'>{f'{leg:.1f}' if leg is not None else '—'}</td>"
            f"<td class='num'>{_fmt_money(mv) if mv is not None else '—'}</td>"
            "</tr>"
        )

    # Top moments (proof-of-play).
    moment_items = ""
    for m in _top_moments(scopes, weights=weights):
        moment_items += (
            "<li>"
            f"<span class='mono'>{_fmt_time(m.get('start_sec'))}</span> "
            f"<strong>{html.escape(str(m.get('asset_type') or 'exposure'))}</strong> "
            f"<span class='ctx'>{html.escape(str(m.get('context') or ''))}</span> — "
            f"{html.escape(str(m.get('description') or ''))} "
            f"<span class='muted'>({html.escape(str(m.get('_game') or ''))})</span>"
            "</li>"
        )
    moments_block = (
        f"<h2>Proof-of-play — top moments</h2><ul class='moments'>{moment_items}</ul>"
        if moment_items
        else ""
    )

    note = html.escape(generated_note) if generated_note else ""

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>{brand_e} — Sponsor Performance Report</title>
<style>
  :root {{ --ink:#12130f; --muted:#6b6f66; --line:#e3e5df; --green:#0b6b53; }}
  * {{ box-sizing:border-box; }}
  body {{ font:14px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
         color:var(--ink); margin:0; padding:40px; max-width:900px; }}
  header {{ display:flex; justify-content:space-between; align-items:flex-end;
           border-bottom:2px solid var(--ink); padding-bottom:12px; margin-bottom:8px; }}
  h1 {{ font-size:22px; margin:0; }}
  h2 {{ font-size:15px; margin:28px 0 8px; }}
  .sub {{ color:var(--muted); font-size:12px; }}
  .brand {{ text-align:right; }}
  .brand .name {{ font-size:18px; font-weight:700; }}
  .tiles {{ display:flex; flex-wrap:wrap; gap:12px; margin:18px 0; }}
  .tile {{ flex:1 1 140px; border:1px solid var(--line); border-radius:10px; padding:12px 14px; }}
  .tile-v {{ font-size:20px; font-weight:700; }}
  .tile-l {{ color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.04em; }}
  table {{ width:100%; border-collapse:collapse; font-size:13px; }}
  th,td {{ text-align:left; padding:7px 8px; border-bottom:1px solid var(--line); }}
  th {{ color:var(--muted); font-weight:600; font-size:11px; text-transform:uppercase; }}
  td.num, th.num {{ text-align:right; font-variant-numeric:tabular-nums; }}
  .green {{ color:var(--green); font-weight:600; }}
  .moments {{ padding-left:18px; }}
  .moments li {{ margin:4px 0; }}
  .mono {{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--green); }}
  .ctx {{ color:var(--muted); font-size:12px; }}
  .muted {{ color:var(--muted); }}
  footer {{ margin-top:32px; padding-top:12px; border-top:1px solid var(--line);
           color:var(--muted); font-size:11px; }}
  @media print {{ body {{ padding:0; }} .tile {{ break-inside:avoid; }} }}
</style></head>
<body>
  <header>
    <div>
      <h1>Sponsor Performance Report</h1>
      <div class="sub">{game_labels}</div>
    </div>
    <div class="brand"><div class="name">{brand_e}</div>
      <div class="sub">Powered by TwelveLabs Jockey</div></div>
  </header>

  <div class="tiles">{''.join(tiles)}</div>

  <h2>Game-by-game breakdown</h2>
  <table>
    <thead><tr>
      <th>Game</th><th class="num">Exposure</th><th class="num">Moments</th>
      <th class="num">Outside W2W</th><th class="num">Legibility</th>
      <th class="num">Media value</th>
    </tr></thead>
    <tbody>{rows}</tbody>
  </table>

  {moments_block}

  <footer>
    Exposure, moments and legibility measured by TwelveLabs Jockey over the
    broadcast footage. Economic figures are computed from the buyer's own
    assumptions (CPM, reach, audience). {note}
  </footer>
</body></html>"""
