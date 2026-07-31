"""Document retrieval use cases."""

from __future__ import annotations

import logging
import time

from knowledge_base.api.errors import BadRequestError, ServiceUnavailableError
from knowledge_base.infrastructure.embeddings import (
    Embedder,
    SparseEmbedder,
    VoyageEmbeddingError,
)
from knowledge_base.infrastructure.qdrant import QdrantStore
from knowledge_base.schemas.search import SearchRequest
from knowledge_base.settings import KnowledgeBaseSettings, get_settings


logger = logging.getLogger(__name__)

class RetrievalService:
    def __init__(
        self,
        *,
        embedder: Embedder,
        sparse_embedder: SparseEmbedder,
        store: QdrantStore,
        settings: KnowledgeBaseSettings | None = None,
    ) -> None:
        self._embedder = embedder
        self._sparse_embedder = sparse_embedder
        self._store = store
        self._settings = settings or get_settings()

    def search(self, request: SearchRequest) -> list[dict]:
        query = request.query.strip()
        if not query:
            raise BadRequestError("Query cannot be empty.")

        start = time.perf_counter()
        try:
            dense_vector = self._embedder.embed_query(query)
        except VoyageEmbeddingError as exc:
            raise ServiceUnavailableError(str(exc)) from exc
        sparse_vector = self._sparse_embedder.embed([query])[0]
        embed_done = time.perf_counter()

        folder_ids = (
            list(
                dict.fromkeys(
                    folder_id.strip()
                    for folder_id in request.folder_ids
                    if folder_id.strip()
                )
            )
            if request.folder_ids
            else None
        )
        candidates = self._store.search(
            business_id=request.business_id,
            dense_vector=dense_vector,
            sparse_vector=sparse_vector,
            folder_ids=folder_ids,
            candidates=self._settings.hybrid_candidates,
        )
        search_done = time.perf_counter()

        logger.info(
            "search timing: embed=%.3fs hybrid_search=%.3fs "
            "total=%.3fs candidates=%d",
            embed_done - start,
            search_done - embed_done,
            search_done - start,
            len(candidates),
        )
        return candidates[: request.limit]
