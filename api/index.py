"""Vercel serverless entrypoint.

Vercel's Python runtime serves the module-level ASGI ``app``. The FastAPI app
lives in ``backend/main.py``; add that directory to the import path and re-export
it here. A catch-all rewrite in ``vercel.json`` routes every request to this
function.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: E402,F401  (re-exported for the Vercel runtime)
