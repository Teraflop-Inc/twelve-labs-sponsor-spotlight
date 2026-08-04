"""Relabel fixture ``asset_type`` values onto a sport's real surface vocabulary.

Until the schemas became sport-aware, ``asset_type`` was constrained by a
hardcoded **basketball** enum (``courtside_led``, ``jersey_patch``,
``scorers_table``, ``backboard``, ``floor_decal``) regardless of the footage.
On the Premier League demo collection that forced every perimeter advertising
board to be reported as ``courtside_led`` and pushed anything without a
basketball analogue into ``other``.

This is not relabelling the model's judgement — the model identified the surface
correctly and had no permitted value to express it with. This restores the term
it was reaching for.

The mapping is lossy where the old vocabulary was coarser than the new one:
``jersey_patch`` covered both shirt-front and shirt-sleeve sponsors, and is
mapped to ``shirt_front``. Re-capture with ``capture_demo_cache`` for exact
values.

Usage (from backend/)::

    uv run python -m pre_processing.relabel_asset_types            # dry run
    uv run python -m pre_processing.relabel_asset_types --write
    uv run python -m pre_processing.relabel_asset_types --write --sport basketball
"""
from __future__ import annotations

import argparse
import collections
import json
import sys

import demo_cache
import sports
from core import config

#: Old basketball enum → the soccer surface it actually described.
SOCCER_FROM_BASKETBALL = {
    "courtside_led": "perimeter_led",
    "jersey_patch": "shirt_front",
    "scorers_table": "substitution_board",
    "backboard": "big_screen",
    "floor_decal": "stadium_fascia",
}


def mapping_for(sport: str) -> dict[str, str]:
    """Old → new for ``sport``. Only soccer needs one; the old enum *was* basketball."""
    if sport == "basketball":
        return {}
    if sport == "soccer":
        return SOCCER_FROM_BASKETBALL
    sys.exit(
        f"No relabel mapping for {sport!r}. The old enum was basketball; add a "
        f"mapping here or re-capture fixtures with capture_demo_cache."
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--write", action="store_true", help="apply changes (default: dry run)")
    ap.add_argument("--sport", default=config.DEMO_SPORT, help="target sport vocabulary")
    args = ap.parse_args()

    mapping = mapping_for(args.sport)
    if not mapping:
        print(f"{args.sport}: fixtures already use this vocabulary — nothing to do.")
        return

    valid = set(sports.get_profile(args.sport)["asset_types"])
    unknown = {v for v in mapping.values() if v not in valid}
    if unknown:
        sys.exit(f"mapping targets not in the {args.sport} vocabulary: {sorted(unknown)}")

    changed_files = 0
    counts: collections.Counter[str] = collections.Counter()

    for path in sorted(demo_cache.FIXTURE_DIR.rglob("*.json")):
        try:
            data = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError):
            continue

        hits = [0]

        def walk(node: object) -> None:
            if isinstance(node, dict):
                current = node.get("asset_type")
                if isinstance(current, str) and current in mapping:
                    node["asset_type"] = mapping[current]
                    counts[f"{current} → {mapping[current]}"] += 1
                    hits[0] += 1
                types = node.get("asset_types")
                if isinstance(types, list):
                    node["asset_types"] = [mapping.get(t, t) for t in types]
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for item in node:
                    walk(item)

        walk(data)
        if hits[0]:
            changed_files += 1
            if args.write:
                path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
            print(f"  {'++' if args.write else '..'} {path.relative_to(demo_cache.FIXTURE_DIR)}: {hits[0]}")

    print(f"\n{'Relabelled' if args.write else 'Would relabel'} {changed_files} file(s):")
    for change, n in counts.most_common():
        print(f"  {change:40} {n}")
    if changed_files and not args.write:
        print("\nDry run — re-run with --write to apply.")


if __name__ == "__main__":
    main()
