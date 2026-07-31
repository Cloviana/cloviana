"""FastAPI dependency providers."""

from __future__ import annotations

from functools import lru_cache

from knowledge_base.infrastructure.embeddings import Embedder, SparseEmbedder
from knowledge_base.infrastructure.parser import DocumentParser
from knowledge_base.infrastructure.qdrant import QdrantStore
from knowledge_base.services.ingestion import IngestionService
from knowledge_base.services.retrieval import RetrievalService
from knowledge_base.settings import get_settings


@lru_cache
def get_embedder() -> Embedder:
    return Embedder.from_settings(get_settings())


@lru_cache
def get_sparse_embedder() -> SparseEmbedder:
    return SparseEmbedder.from_settings(get_settings())


@lru_cache
def get_qdrant_store() -> QdrantStore:
    return QdrantStore.from_settings(get_settings())


@lru_cache
def get_document_parser() -> DocumentParser:
    return DocumentParser.from_settings(get_settings())


def get_ingestion_service() -> IngestionService:
    return IngestionService(
        embedder=get_embedder(),
        sparse_embedder=get_sparse_embedder(),
        store=get_qdrant_store(),
        parser=get_document_parser(),
        settings=get_settings(),
    )


def get_retrieval_service() -> RetrievalService:
    return RetrievalService(
        embedder=get_embedder(),
        sparse_embedder=get_sparse_embedder(),
        store=get_qdrant_store(),
        settings=get_settings(),
    )
