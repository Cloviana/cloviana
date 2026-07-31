"""Business-scoped persistent memory with thread-scoped scratch storage."""

from __future__ import annotations

from collections.abc import Mapping
from hashlib import sha256

from deepagents.backends import (
    BackendProtocol,
    CompositeBackend,
    StateBackend,
    StoreBackend,
)
from langgraph.runtime import Runtime

from agent.context import BusinessContext


MEMORY_PATH = "/memories/"
_MEMORY_NAMESPACE_SUFFIX = "memories"


def business_memory_namespace(
    runtime: Runtime[BusinessContext],
) -> tuple[str, ...]:
    """Return a stable, non-reversible store namespace for one business."""

    business_key = sha256(
        runtime.context.business_id.encode("utf-8")
    ).hexdigest()
    return (f"business-{business_key}", _MEMORY_NAMESPACE_SUFFIX)


def build_memory_backend(
    *,
    default: BackendProtocol | None = None,
    routes: Mapping[str, BackendProtocol] | None = None,
) -> CompositeBackend:
    """Route persistent memory separately from conversation scratch files.

    Unmatched paths use ``StateBackend`` and remain scoped to the active
    LangGraph thread. Files under ``/memories/`` use the deployment's Store
    and remain available to every thread belonging to the same business.
    """

    resolved_routes: dict[str, BackendProtocol] = {
        MEMORY_PATH: StoreBackend(namespace=business_memory_namespace),
    }
    for path, backend in (routes or {}).items():
        if path == MEMORY_PATH:
            raise ValueError(f"{MEMORY_PATH} is reserved for persistent memory")
        resolved_routes[path] = backend

    return CompositeBackend(
        default=default if default is not None else StateBackend(),
        routes=resolved_routes,
    )
