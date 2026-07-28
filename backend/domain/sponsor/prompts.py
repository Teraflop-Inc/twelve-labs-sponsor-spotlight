"""Prompts sent to Jockey ``/responses``, one builder per analysis pass.

**Scoping a call to one broadcast.** A knowledge store holds several games, so
most calls need to be narrowed to one. Jockey supports this via ``selections``:
pass a list of knowledge-store items, and reference them positionally in the
prompt with ``{{sel:N}}`` tokens. :func:`game_scope_phrase` emits the
``{{sel:0}}`` reference that binds to ``selections[0]``.

When no ``game_id`` is set (the "All games" aggregate) there is nothing to
select, so we instead list the store's broadcasts by filename via
:func:`videos_roster_for_prompt` and ask Jockey to attribute each moment to one.
:func:`scope_phrase` picks between the two.
"""
from __future__ import annotations

from typing import Any

import games
import sports

# Visual descriptions for brands whose marks are easy to confuse or miss.
# Injected into the compare/legibility prompts so the model knows what it's
# looking for rather than guessing from the name alone.
BRAND_VISUAL_HINTS: dict[str, str] = {
    "Toyota": (
        "Red Toyota logo: three overlapping ellipses forming a stylized 'T' inside a "
        "horizontal oval, with the wordmark TOYOTA below in red sans-serif capitals."
    ),
    "Alaska Airlines": (
        "Alaska Airlines wordmark: dark navy stylized 'Alaska' script in italic, often "
        "with a stylized Eskimo profile in newer marks. The brand is the airline; the "
        "courtside / arena partnership uses 'Alaska Airlines' or just 'Alaska' in navy."
    ),
}


def active_profile(sport: str | None) -> dict[str, str]:
    """Resolve the sport profile (instructions + surface vocabulary) for a collection."""
    return sports.get_profile(sport)


def brand_hints(brands: list[str]) -> str:
    """Bullet list of visual hints for ``brands``, for prompts that need them."""
    return "\n".join(
        f"- {b}: {BRAND_VISUAL_HINTS.get(b, 'no visual hint provided')}" for b in brands
    )


def videos_roster_for_prompt(videos: list[str]) -> str:
    """List ready videos so Jockey can attribute moments per-game.

    The UI sends the filenames of the store's ready broadcasts.
    """
    names = [v for v in (videos or []) if v]
    if not names:
        return ""
    lines = "\n".join(f"- {n}" for n in names)
    return (
        f"\n\nThe knowledge store contains {len(names)} broadcast(s):\n{lines}\n"
        f"When citing a moment, set the `video` field to the exact source video filename.\n"
    )


def game_scope_phrase(game_id: str | None) -> str:
    """Prompt suffix that scopes the analysis to a single broadcast via ``{{sel:0}}``.

    Used in place of :func:`videos_roster_for_prompt` when a ``game_id`` is set:
    the ``{{sel:0}}`` token binds to ``selections[0]`` (the game's knowledge-store
    item), telling Jockey to look only at that broadcast.
    """
    g = games.by_id(game_id)
    if not g:
        return ""
    return (
        f"\n\nAnalyze ONLY this single broadcast: {{{{sel:0}}}} ({g['label']}). "
        f"Ignore every other video in the knowledge store. "
        f"Set each moment's `video` field to this broadcast's filename.\n"
    )


def broadcast_scope_phrase(label: str) -> str:
    """``{{sel:0}}`` suffix for a broadcast identified by asset id rather than
    a roster entry."""
    return (
        f"\n\nAnalyze ONLY this single broadcast: {{{{sel:0}}}} ({label}). "
        f"Ignore every other video in the knowledge store. "
        f"Set each moment's `video` field to this broadcast's filename.\n"
    )


def scope_phrase(
    game_id: str | None,
    videos: list[str],
    selections: list[dict[str, Any]] | None,
    asset_label: str | None = None,
) -> str:
    """The scoping suffix for a call: single-broadcast ``{{sel:0}}`` or whole-store roster."""
    if not selections:
        return videos_roster_for_prompt(videos)
    if asset_label:
        return broadcast_scope_phrase(asset_label)
    return game_scope_phrase(game_id)


# --- Pass 1: brand discovery ---------------------------------------------------


def discovery_message(surfaces_phrase: str, scope: str) -> str:
    return (
        "List every distinct sponsor brand visible anywhere in this broadcast — "
        f"across these surfaces: {surfaces_phrase}. "
        "Be thorough; surface even small or briefly-visible logos. "
        "For each brand return ONLY: name and asset_types[]. "
        "Do NOT enumerate timestamps in this pass. "
        "End with a one-sentence `summary` of the sponsorship landscape."
        + scope
    )


# --- Pass 2: per-brand appearances ---------------------------------------------


def per_brand_message(brand_name: str, scope: str) -> str:
    return (
        f"Focus ONLY on the sponsor brand '{brand_name}'. Return:\n"
        f"  - name: '{brand_name}'\n"
        f"  - total_seconds visible across the broadcast\n"
        f"  - moments_count\n"
        f"  - outside_whistle_to_whistle_seconds (pregame, halftime, postgame, timeouts)\n"
        f"  - asset_types: every surface it appears on\n"
        f"  - appearances[]: every distinct exposure with start_sec, end_sec, "
        f"view (how it's framed: close_up / wide_shot / other — a single value), "
        f"events (what's happening in the match at that moment: goal, celebration, "
        f"replay, pregame, halftime, postgame, timeout, substitution, commercial — "
        f"zero or more; leave empty if nothing notable is happening), "
        f"asset_type, brief description, confidence, source video filename, "
        f"placement (primary = large/sharp/foreground, secondary = small/background), and — "
        f"read from the on-screen scorebug — the match period (first half / halftime / "
        f"second half / stoppage / pre/postgame) and the game_clock exactly as shown "
        f"(e.g. 23:31, 45:00, 01:07:34). Include all appearances you can identify; do not cap.\n"
        f"  - legibility_notes if it renders poorly anywhere."
        + scope
    )


# --- Pass 2b: match-event windows ----------------------------------------------


def event_windows_message(phrase: str, scope: str) -> str:
    """One focused question ("find every goal") — maximizes recall vs. the
    per-brand pass, which is tunnel-visioned on a single logo."""
    return (
        f"Identify EVERY moment in this broadcast where {phrase}. "
        f"For each occurrence return a window with precise start_sec and end_sec "
        f"(seconds from the video start), the team involved if identifiable, a "
        f"brief description, a confidence 0-1, and the source video filename. "
        f"Be exhaustive — list every occurrence, do not cap or summarize away any."
        + scope
    )


# --- Pass 3: legibility audit --------------------------------------------------


def legibility_message(brands: list[str], surfaces_phrase: str, scope: str) -> str:
    return (
        f"Produce a CREATIVE & VISIBILITY audit for these sponsor brands across the broadcast:\n"
        f"{', '.join(brands)}\n\n"
        f"Visual hints:\n{brand_hints(brands)}\n\n"
        f"For EACH brand, evaluate every asset type they appear on "
        f"({surfaces_phrase}). For each asset, score 0-10 on: contrast, "
        f"size, position, camera_angle, motion_blur, and overall_score. Cite "
        f"specific timestamped examples in `examples` where the asset rendered "
        f"poorly. In `suggestions`, recommend concrete creative or placement "
        f"fixes (e.g. 'increase contrast — current navy-on-charcoal loses "
        f"detail in wide shots; switch to white outline')."
        + scope
    )


# --- Two-brand comparison ------------------------------------------------------


def compare_message(brands: list[str], max_top_moments: int, scope: str) -> str:
    return (
        f"Compare sponsor exposure across the broadcast for these brands:\n"
        f"{', '.join(brands)}\n\n"
        f"Visual hints:\n{brand_hints(brands)}\n\n"
        f"For EACH brand, return total_seconds visible, moments_count, "
        f"outside_whistle_to_whistle_seconds (pregame/halftime/postgame/timeouts), "
        f"the top {max_top_moments} moments by impact (each with start_sec, "
        f"end_sec, context, asset_type, description, confidence, and video filename), and "
        f"legibility_notes if a brand's mark renders poorly. "
        f"Finally pick a 'winner' for renewal-conversation impact and explain why."
        + scope
    )
