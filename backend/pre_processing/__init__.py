"""Offline pipeline — **none of this runs on Vercel.**

These scripts talk to Jockey directly, take minutes-to-hours, and write results
into ``backend/demo_fixtures/`` (committed) and Vercel Blob. The deployed app
only ever *reads* what they produce.

Run them from ``backend/`` as modules, so the package imports resolve::

    uv run python -m pre_processing.ingest_assets       # Step 0 — upload + index
    uv run python -m pre_processing.capture_demo_cache  # Step 1 — fixtures
    uv run python -m pre_processing.build_reels         # Step 2 — highlight reels

The directory is ``pre_processing`` (underscore) rather than ``pre-processing``
because these are importable modules, not standalone files — a hyphen would make
the ``-m`` form impossible.
"""
from core import env

# Offline scripts read ``TWELVELABS_API_KEY`` at module level, so load
# ``backend/.env`` here — before any submodule is imported.
env.load()
