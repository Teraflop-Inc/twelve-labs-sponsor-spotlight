"""Thin client for the TwelveLabs Jockey (Agents) API v1.3."""
from __future__ import annotations

import asyncio
import contextvars
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx

BASE_URL = "https://api.twelvelabs.io/v1.3"

log = logging.getLogger("jockey")

# The one environment variable holding a TwelveLabs key. Used by the offline
# scripts and, when set on the server, by the locked demo tab.
API_KEY_ENV_VAR = "TWELVELABS_API_KEY"


def key_from_env() -> str | None:
    """The configured TwelveLabs key, or ``None``."""
    return (os.environ.get(API_KEY_ENV_VAR) or "").strip() or None


# Per-request API key. The web UI lets each user paste their own TwelveLabs key,
# which the app forwards as an `x-api-key` header; a request-scoped ContextVar
# carries it down to every client call. Falls back to the env var for local /
# CLI use (e.g. ingest_assets.py).
_API_KEY_CTX: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "twelvelabs_api_key", default=None
)


def set_api_key(key: str | None) -> None:
    """Set the API key for the current request context (None clears it)."""
    _API_KEY_CTX.set(key or None)


def _api_key() -> str:
    key = _API_KEY_CTX.get() or key_from_env()
    if not key:
        raise RuntimeError(f"No TwelveLabs API key — set {API_KEY_ENV_VAR}")
    return key


class JockeyError(RuntimeError):
    """A /responses call that failed after retries.

    Carries the upstream HTTP status and TwelveLabs' own message so callers can
    surface something actionable — "daily Response limit (15/day), resets at
    …" is useful; "Internal Server Error" is not.
    """

    def __init__(self, status: int, body: str, *, sent: Any = None) -> None:
        self.status = status
        self.code = ""
        self.message = body[:500]
        try:
            parsed = json.loads(body)
        except (ValueError, TypeError):
            parsed = None
        if isinstance(parsed, dict):
            self.code = str(parsed.get("code") or "")
            self.message = str(parsed.get("message") or self.message)
        self.sent = sent
        super().__init__(f"/responses failed {status} ({self.code or 'error'}): {self.message}")


def _headers(send_json: bool = True) -> dict[str, str]:
    h = {"x-api-key": _api_key()}
    if send_json:
        h["Content-Type"] = "application/json"
    return h


async def upload_asset_file(path: str, filename: str | None = None) -> str:
    """Upload a local file as an asset; return asset_id."""
    name = filename or os.path.basename(path)
    async with httpx.AsyncClient(timeout=httpx.Timeout(None, connect=30.0)) as client:
        with open(path, "rb") as f:
            files = {
                "method": (None, "direct"),
                "file": (name, f, "video/mp4"),
            }
            r = await client.post(
                f"{BASE_URL}/assets",
                headers={"x-api-key": _api_key()},
                files=files,
            )
        if r.status_code >= 400:
            raise RuntimeError(f"asset upload failed {r.status_code}: {r.text}")
        return r.json()["_id"]


async def upload_asset_url(url: str) -> str:
    """Upload an asset by URL; return asset_id."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{BASE_URL}/assets",
            headers={"x-api-key": _api_key()},
            files=[("method", (None, "url")), ("url", (None, url))],
        )
        r.raise_for_status()
        return r.json()["_id"]


async def get_asset(asset_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{BASE_URL}/assets/{asset_id}", headers={"x-api-key": _api_key()}
        )
        r.raise_for_status()
        return r.json()


async def create_knowledge_store(
    name: str,
    description: str | None = None,
    metadata: dict[str, str] | None = None,
) -> str:
    body: dict[str, Any] = {"name": name}
    if description:
        body["ingestion_config"] = {
            "enrichment_config": {"type": "description", "description": description}
        }
    if metadata:
        body["metadata"] = metadata
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{BASE_URL}/knowledge-stores", headers=_headers(), json=body
        )
        r.raise_for_status()
        return r.json()["_id"]


async def list_knowledge_stores(limit: int = 50) -> list[dict[str, Any]]:
    """List knowledge stores in the account (newest first)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{BASE_URL}/knowledge-stores",
            headers=_headers(send_json=False),
            params={"page_limit": limit},
        )
        r.raise_for_status()
        data = r.json().get("data", [])
    data.sort(key=lambda k: k.get("created_at") or "", reverse=True)
    return data


async def get_knowledge_store(store_id: str) -> dict[str, Any]:
    """Fetch a single knowledge store (includes its metadata)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{BASE_URL}/knowledge-stores/{store_id}",
            headers=_headers(send_json=False),
        )
        r.raise_for_status()
        return r.json()


async def list_items(store_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """List items (assets) in a knowledge store (page_limit caps at 50)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{BASE_URL}/knowledge-stores/{store_id}/items",
            headers=_headers(send_json=False),
            params={"page_limit": min(limit, 50)},
        )
        r.raise_for_status()
        return r.json().get("data", [])


async def add_item(store_id: str, asset_id: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{BASE_URL}/knowledge-stores/{store_id}/items",
            headers=_headers(),
            json={"asset_id": asset_id},
        )
        r.raise_for_status()
        return r.json()["_id"]


async def get_item(store_id: str, item_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{BASE_URL}/knowledge-stores/{store_id}/items/{item_id}",
            headers={"x-api-key": _api_key()},
        )
        r.raise_for_status()
        return r.json()


def _retry_delay(text: str, attempt: int) -> float:
    """Seconds to wait before retrying a 429/5xx.

    Jockey's 429 body carries the reset time ("...try again later after
    2026-06-23T13:46:59Z"); honor it when present (capped), else exponential.
    """
    m = re.search(r"after\s+(\d{4}-\d{2}-\d{2}T[\d:.]+Z)", text)
    if m:
        try:
            reset = datetime.fromisoformat(m.group(1).replace("Z", "+00:00"))
            secs = (reset - datetime.now(timezone.utc)).total_seconds()
            return max(2.0, min(secs + 1.0, 70.0))
        except ValueError:
            pass
    return min(2.0 * (2**attempt), 60.0)


async def responses(
    instructions: str,
    user_message: str,
    knowledge_store_id: str,
    session_id: str | None = None,
    json_schema: dict[str, Any] | None = None,
    selections: list[dict[str, Any]] | None = None,
    timeout_s: float = 600.0,
    max_attempts: int = 5,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "model": "jockey1.0",
        "instructions": instructions,
        "input": [{"type": "message", "role": "user", "content": user_message}],
        "knowledge_store_id": knowledge_store_id,
    }
    if session_id:
        body["session_id"] = session_id
    # Per-game scoping: reference selected knowledge-store items (``ksi_…``) via a
    # ``{{sel:N}}`` token in the prompt. Passed through verbatim to /responses.
    if selections:
        body["selections"] = selections
    if json_schema:
        body["text"] = {
            "format": {
                "type": "json_schema",
                "name": json_schema.get("name", "structured_output"),
                "schema": json_schema["schema"],
            }
        }
    last_err: JockeyError | None = None
    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_s)) as client:
        for attempt in range(max_attempts):
            r = await client.post(f"{BASE_URL}/responses", headers=_headers(), json=body)
            if r.status_code < 400:
                return r.json()
            last_err = JockeyError(r.status_code, r.text, sent=body)
            # Retry per-minute rate-limits (429) and transient server errors
            # (5xx). A plan/quota cap is also a 429 but will not clear for hours,
            # so retrying it just burns a minute before failing anyway.
            retryable = (
                r.status_code == 429 or r.status_code >= 500
            ) and last_err.code != "plan_limit_exceeded"
            if retryable and attempt < max_attempts - 1:
                delay = _retry_delay(r.text, attempt)
                log.warning(
                    "/responses %s — retry %d/%d in %.0fs",
                    r.status_code, attempt + 1, max_attempts - 1, delay,
                )
                await asyncio.sleep(delay)
                continue
            break
    if last_err is None:  # pragma: no cover — the loop always sets it
        raise JockeyError(0, "/responses failed with no response")
    raise last_err


def extract_text(response: dict[str, Any]) -> str:
    """Pull the assistant text out of a /responses payload."""
    try:
        return response["output"][0]["content"][0]["text"]
    except (KeyError, IndexError, TypeError):
        return ""


def extract_json(response: dict[str, Any]) -> tuple[str, Any]:
    """``(text, parsed)`` for a schema-constrained ``/responses`` call.

    ``parsed`` is ``None`` when the payload had no text or the model returned
    something that isn't valid JSON despite the ``json_schema`` — callers decide
    whether that's fatal or just an empty result.
    """
    text = extract_text(response)
    if not text:
        return text, None
    try:
        return text, json.loads(text)
    except json.JSONDecodeError:
        return text, None


async def wait_for_asset(asset_id: str, *, timeout_s: int = 1800) -> dict[str, Any]:
    elapsed = 0
    while elapsed < timeout_s:
        a = await get_asset(asset_id)
        if a.get("status") in ("ready", "failed"):
            return a
        await asyncio.sleep(5)
        elapsed += 5
    raise TimeoutError(f"Asset {asset_id} did not become ready in {timeout_s}s")


async def wait_for_item(
    store_id: str, item_id: str, *, timeout_s: int = 1800
) -> dict[str, Any]:
    elapsed = 0
    while elapsed < timeout_s:
        it = await get_item(store_id, item_id)
        if it.get("status") in ("ready", "failed"):
            return it
        await asyncio.sleep(10)
        elapsed += 10
    raise TimeoutError(f"Item {item_id} did not become ready in {timeout_s}s")
