"""Exa search client with a request rate limit shared across all instances."""

from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import deque
from collections.abc import Sequence
from datetime import date
from typing import Any

import httpx

from agent.settings import get_settings


EXA_API_URL = "https://api.exa.ai"
_EXA_TIMEOUT = httpx.Timeout(30.0, connect=5.0)
_MAX_HIGHLIGHT_CHARS = 2_000
_MAX_EXTRACT_CHARS = 20_000
DEFAULT_SEARCH_MAX_PER_SECOND = 10
DEFAULT_CONTENTS_MAX_PER_SECOND = 100
logger = logging.getLogger(__name__)


class ExaServiceError(RuntimeError):
    """Raised when Exa cannot return a valid response."""


# One shared client so Exa calls reuse pooled connections instead of opening
# a new socket per request.
_client = httpx.AsyncClient(timeout=_EXA_TIMEOUT)


class _RateLimiter:
    """Caps how many calls can start within any rolling one-second window."""

    def __init__(self, max_per_second: int) -> None:
        self._max_per_second = max_per_second
        self._lock = asyncio.Lock()
        self._started: deque[float] = deque()

    async def acquire(self) -> None:
        async with self._lock:
            while True:
                now = time.monotonic()
                while self._started and now - self._started[0] >= 1.0:
                    self._started.popleft()
                if len(self._started) < self._max_per_second:
                    self._started.append(now)
                    return
                await asyncio.sleep(1.0 - (now - self._started[0]))


class ExaService:
    # ponytail: process-wide, shared by every instance regardless of how many
    # are constructed, matching Exa's documented per-endpoint rate limits.
    _search_rate_limiter = _RateLimiter(
        int(os.getenv("EXA_SEARCH_MAX_PER_SECOND", DEFAULT_SEARCH_MAX_PER_SECOND))
    )
    _contents_rate_limiter = _RateLimiter(
        int(os.getenv("EXA_CONTENTS_MAX_PER_SECOND", DEFAULT_CONTENTS_MAX_PER_SECOND))
    )

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    @classmethod
    def from_env(cls) -> ExaService:
        return cls(api_key=get_settings().exa_api_key.get_secret_value())

    async def search(
        self,
        query: str,
        limit: int = 10,
        include_domains: Sequence[str] | None = None,
        start_published_date: date | None = None,
    ) -> list[dict[str, str]]:
        payload: dict[str, Any] = {
            "query": query,
            "type": "auto",
            "numResults": limit,
            "contents": {
                "highlights": {
                    "query": query,
                    "maxCharacters": _MAX_HIGHLIGHT_CHARS,
                }
            },
        }
        if include_domains:
            payload["includeDomains"] = list(include_domains)
        if start_published_date:
            payload["startPublishedDate"] = start_published_date.isoformat()

        await self._search_rate_limiter.acquire()
        data = await self._post("/search", payload)
        results = data.get("results", [])
        if not isinstance(results, list):
            raise ExaServiceError("Exa returned invalid results")

        return [item for item in results if isinstance(item, dict)]

    async def contents(
        self,
        urls: list[str],
        max_characters: int = _MAX_EXTRACT_CHARS,
    ) -> list[dict[str, str]]:
        payload = {
            "urls": urls,
            "text": {"maxCharacters": max_characters},
        }

        await self._contents_rate_limiter.acquire()
        data = await self._post("/contents", payload)
        results = data.get("results", [])
        if not isinstance(results, list):
            raise ExaServiceError("Exa returned invalid results")

        return [item for item in results if isinstance(item, dict)]

    async def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = await _client.post(
                f"{EXA_API_URL}{path}",
                headers={
                    "x-api-key": self._api_key,
                    "x-exa-integration": "cloviana-agent",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Exa request failed: status=%s url=%s response=%s",
                exc.response.status_code,
                exc.request.url,
                exc.response.text[:2_000],
            )
            raise ExaServiceError("Exa request failed") from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise ExaServiceError("Exa request failed") from exc

        if not isinstance(data, dict):
            raise ExaServiceError("Exa returned an invalid response")
        return data
