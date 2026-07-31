"""Fetch and inject the business's brand profile on every model call."""

from __future__ import annotations

import logging
import time
from collections.abc import Awaitable, Callable
from typing import TypedDict

import httpx
from langchain.agents.middleware import AgentMiddleware, AgentState, ModelRequest
from langchain_core.messages import SystemMessage

from agent.context import BusinessContext
from agent.settings import get_settings


logger = logging.getLogger(__name__)

_BRAND_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
_CACHE_TTL_SECONDS = 300


class BrandProfile(TypedDict):
    name: str
    description: str


class BrandProviderError(RuntimeError):
    """Raised when the brand profile service returns an invalid response."""


def _api_base_url() -> str:
    return get_settings().cloviana_api_url


def _internal_token() -> str:
    return get_settings().agent_internal_token.get_secret_value()


_cache: dict[str, tuple[float, BrandProfile]] = {}
_CACHE_MAX_ENTRIES = 512

# One shared client so profile fetches reuse connections instead of opening
# a new socket per model call.
_client = httpx.AsyncClient(timeout=_BRAND_TIMEOUT)


async def fetch_brand_profile(business_id: str) -> BrandProfile:
    cached = _cache.get(business_id)
    if cached and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    try:
        response = await _client.get(
            f"{_api_base_url()}/internal/businesses/{business_id}/profile",
            headers={"x-internal-token": _internal_token()},
        )
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise BrandProviderError("Brand profile request failed") from exc

    if not isinstance(data, dict):
        raise BrandProviderError("Brand profile service returned an invalid response")

    profile = BrandProfile(
        name=str(data.get("name") or ""),
        description=str(data.get("description") or ""),
    )
    if len(_cache) >= _CACHE_MAX_ENTRIES:
        # ponytail: evict the stalest entry; an LRU is overkill for a cache
        # this small with a 5-minute TTL.
        _cache.pop(min(_cache, key=lambda key: _cache[key][0]))
    _cache[business_id] = (time.monotonic(), profile)
    return profile


class BrandContextMiddleware(AgentMiddleware[AgentState, BusinessContext]):
    """Append the business's brand name and description to every model call."""

    async def _prepare_request(
        self,
        request: ModelRequest[BusinessContext],
    ) -> ModelRequest[BusinessContext]:
        runtime = request.runtime
        context = runtime.context if runtime is not None else None
        if not isinstance(context, BusinessContext):
            raise PermissionError("A validated business context is required")

        try:
            profile = await fetch_brand_profile(context.business_id)
        except BrandProviderError:
            logger.exception(
                "Brand profile fetch failed for business=%s",
                context.business_id,
            )
            # ponytail: fail open, the knowledge base tool still grounds brand facts
            return request

        brand_context = (
            "# Brand\n"
            "You are Cloviana, currently working on behalf of this specific "
            "business. Treat the following as your authoritative brand "
            "identity for this conversation, not a knowledge base result.\n"
            f"Name: {profile['name']}\n"
            f"Description: {profile['description']}"
        )
        return request.override(
            system_message=self._append_context(request.system_message, brand_context)
        )

    @staticmethod
    def _append_context(
        message: SystemMessage | None,
        brand_context: str,
    ) -> SystemMessage:
        if message is None:
            return SystemMessage(content=brand_context)
        if isinstance(message.content, str):
            content = f"{message.content.rstrip()}\n\n{brand_context}"
        else:
            content = [
                *message.content,
                {"type": "text", "text": f"\n\n{brand_context}"},
            ]
        return message.model_copy(update={"content": content})

    async def awrap_model_call(
        self,
        request: ModelRequest[BusinessContext],
        handler: Callable[[ModelRequest[BusinessContext]], Awaitable[object]],
    ) -> object:
        return await handler(await self._prepare_request(request))
