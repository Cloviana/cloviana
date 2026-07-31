"""FastAPI application factory."""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import anyio
from fastapi import FastAPI

from knowledge_base.api.dependencies import (
    get_document_parser,
    get_embedder,
    get_qdrant_store,
    get_sparse_embedder,
)
from knowledge_base.api.errors import register_error_handlers
from knowledge_base.api.routes import documents, folders, health, search


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # BM25 is the only local model left; dense inference and document parsing
    # are handled by managed providers.
    await anyio.to_thread.run_sync(get_sparse_embedder().load)
    try:
        yield
    finally:
        get_document_parser().close()
        get_embedder().close()
        get_qdrant_store().close()


def create_app() -> FastAPI:
    application = FastAPI(title="Cloviana Knowledge Base", lifespan=lifespan)
    register_error_handlers(application)
    application.include_router(health.router)
    application.include_router(documents.router)
    application.include_router(folders.router)
    application.include_router(search.router)
    return application
