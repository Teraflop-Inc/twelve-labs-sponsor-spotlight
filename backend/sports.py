"""Sport-specific profiles for sponsor-exposure analysis.

Each profile bundles the language that should change per sport:
  - enrichment:      index-time ingestion config (what to extract per sport)
  - instructions:    query-time system prompt (the analyst lens)
  - surfaces_phrase: natural-language list of sponsor surfaces, used in prompts

A collection records its sport in the knowledge-store metadata, so query time
can pick the matching profile. Keep enrichment broad-but-named per the Jockey
docs (name the surfaces, but still catch small/partial/background logos).
"""
from __future__ import annotations

from typing import Any

DEFAULT_SPORT = "soccer"


def _profile(
    label: str, surfaces_phrase: str, enrichment_lead: str, contexts: str
) -> dict[str, str]:
    enrichment = (
        f"{enrichment_lead} Extract every visible sponsor, advertiser, and brand "
        f"and where each one appears. Sponsor surfaces include: {surfaces_phrase}. "
        "For each appearance capture the brand name, the surface/placement type, "
        f"the broadcast context ({contexts}), and how prominent and legible the "
        "logo is. Include small, partial, briefly-visible, angled, or background "
        "logos — not only large foreground ones. Read and transcribe brand "
        "wordmarks even when only partially visible."
    )
    instructions = (
        "You are a sponsorship ROI analyst. Identify every moment where a sponsor "
        f"brand is visible across these surfaces: {surfaces_phrase}. "
        f"Classify each moment's broadcast context ({contexts}). "
        "Pay special attention to exposure outside live play (pre-game, breaks, "
        "post-game) — that's where conventional reporting misses value. "
        "Always include precise start/end timestamps in seconds from the video "
        "start. Surface even small or briefly-visible logos."
    )
    return {
        "label": label,
        "surfaces_phrase": surfaces_phrase,
        "enrichment": enrichment,
        "instructions": instructions,
    }


SPORT_PROFILES: dict[str, dict[str, str]] = {
    "soccer": _profile(
        "Soccer / Football",
        "rotating and static perimeter LED advertising boards around the pitch; "
        "shirt-front sponsors; shirt-sleeve sponsors; kit manufacturer logos; "
        "shorts and training-kit sponsors; stadium fascia, stand and tunnel "
        "signage; big-screen and scoreboard ads; goal-net, corner-flag and "
        "substitution-board branding; flash-interview and press backdrops; "
        "broadcast graphics, lower-thirds, the scorebug and bug/ident overlays; "
        "and in-broadcast commercials",
        "This is a soccer (association football) broadcast.",
        "open play, goal, celebration, replay, close-up, wide shot, pregame, "
        "halftime, postgame, substitution, commercial, other",
    ),
    "basketball": _profile(
        "Basketball",
        "courtside LED boards; jersey patches; the scorer's table; the backboard "
        "and stanchion; floor decals and the center-court logo; the apron and "
        "baseline signage; broadcast overlays and lower-thirds; interview "
        "backdrops; and in-game commercials",
        "This is a basketball broadcast.",
        "score, celebration, replay, close_up, wide_shot, pregame, halftime, "
        "postgame, timeout, commercial, other",
    ),
    "american_football": _profile(
        "American Football",
        "end-zone and field-level LED and painted signage; jersey and helmet "
        "branding; sideline and bench signage; goalpost and wall pads; the "
        "50-yard-line and midfield logos; broadcast overlays and lower-thirds; "
        "interview backdrops; and in-game commercials",
        "This is an American football broadcast.",
        "play, scoring_play, celebration, replay, close_up, wide_shot, pregame, "
        "halftime, postgame, timeout, commercial, other",
    ),
    "baseball": _profile(
        "Baseball",
        "outfield wall signage; the backstop rotational behind home plate; "
        "dugout and on-deck signage; jersey and helmet branding; the pitcher's "
        "mound and base logos; broadcast overlays and lower-thirds; interview "
        "backdrops; and in-game commercials",
        "This is a baseball broadcast.",
        "at_bat, scoring_play, celebration, replay, close_up, wide_shot, pregame, "
        "inning_break, postgame, commercial, other",
    ),
    "hockey": _profile(
        "Ice Hockey",
        "dasher boards around the rink; in-ice painted logos; jersey branding; "
        "glass and bench signage; the center-ice logo; broadcast overlays and "
        "lower-thirds; interview backdrops; and in-game commercials",
        "This is an ice hockey broadcast.",
        "play, goal, celebration, replay, close_up, wide_shot, pregame, "
        "intermission, postgame, commercial, other",
    ),
    "generic": _profile(
        "Generic / Other",
        "perimeter and field/court-level advertising boards and LED signage; "
        "uniform, kit and equipment branding; venue and stadium signage; "
        "scoreboard and big-screen ads; broadcast graphics, lower-thirds and "
        "overlays; interview backdrops; and in-broadcast commercials",
        "This is a sports broadcast.",
        "live_play, scoring, celebration, replay, close_up, wide_shot, pregame, "
        "break, postgame, commercial, other",
    ),
}


def get_profile(sport: str | None) -> dict[str, str]:
    """Return the profile for a sport key, falling back to the default."""
    return SPORT_PROFILES.get(sport or "", SPORT_PROFILES[DEFAULT_SPORT])


def list_sports() -> list[dict[str, str]]:
    """[{key, label}] for the UI picker, default sport first."""
    keys = [DEFAULT_SPORT] + [k for k in SPORT_PROFILES if k != DEFAULT_SPORT]
    return [{"key": k, "label": SPORT_PROFILES[k]["label"]} for k in keys]
