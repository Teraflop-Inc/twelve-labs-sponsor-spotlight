"""Load ``backend/.env`` before anything reads the environment.

Imported for its side effect by :mod:`core.config` (the web app) and by
:mod:`pre_processing` (the offline scripts) — the two entry surfaces. Both call
:func:`load` at import time, before any module-level ``os.environ`` read.

Real environment variables always win: ``override=False`` means an exported
``TWELVELABS_API_KEY`` beats whatever is in the file. On Vercel there is no
``.env`` and the call is a no-op — config comes from project env vars.
"""
from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"


def load() -> None:
    """Load ``backend/.env`` if present. Idempotent; safe to call repeatedly."""
    load_dotenv(ENV_PATH, override=False)
