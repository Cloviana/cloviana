"""Runtime settings for the knowledge-base service."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class KnowledgeBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", extra="ignore", frozen=True)

    qdrant_host: str = Field(default="localhost", validation_alias="QDRANT_HOST")
    qdrant_port: int = Field(default=6333, validation_alias="QDRANT_PORT")
    qdrant_collection_prefix: str = Field(
        default="kb_voyage_context_4",
        pattern=r"^[A-Za-z0-9_-]+$",
        validation_alias="QDRANT_COLLECTION_PREFIX",
    )
    voyage_api_key: str | None = Field(default=None, validation_alias="VOYAGE_API_KEY")
    embedding_model: str = Field(
        default="voyage-context-4",
        validation_alias="VOYAGE_EMBEDDING_MODEL",
    )
    embedding_dimension: Literal[256, 512, 1024, 2048] = Field(
        default=1024,
        validation_alias="VOYAGE_EMBEDDING_DIMENSION",
    )
    voyage_timeout_seconds: float = Field(
        default=120.0,
        gt=0,
        validation_alias="VOYAGE_TIMEOUT_SECONDS",
    )
    voyage_request_max_chars: int = Field(
        default=200_000,
        ge=10_000,
        validation_alias="VOYAGE_REQUEST_MAX_CHARS",
    )
    sparse_embedding_model: str = Field(
        default="Qdrant/bm25",
        validation_alias="SPARSE_EMBEDDING_MODEL",
    )
    unstructured_api_key: str | None = Field(
        default=None,
        validation_alias="UNSTRUCTURED_API_KEY",
    )
    unstructured_api_url: str = Field(
        default="https://platform-api.transform.unstructured.io/api/v1",
        validation_alias="UNSTRUCTURED_API_URL",
    )
    unstructured_timeout_seconds: float = Field(
        default=300.0,
        gt=0,
        validation_alias="UNSTRUCTURED_TIMEOUT_SECONDS",
    )
    unstructured_poll_interval_seconds: float = Field(
        default=5.0,
        gt=0,
        validation_alias="UNSTRUCTURED_POLL_INTERVAL_SECONDS",
    )
    fastembed_cache_path: str = Field(default="/models", validation_alias="FASTEMBED_CACHE_PATH")
    kb_min_score: float = Field(default=0.35, validation_alias="KB_MIN_SCORE")
    # Total candidate pool used by fused dense and sparse retrieval.
    hybrid_candidates: int = Field(
        default=100,
        ge=1,
        le=100,
        validation_alias="KB_HYBRID_CANDIDATES",
    )
    max_file_size: int = Field(
        default=5 * 1024 * 1024,
        ge=1,
        validation_alias="KB_MAX_FILE_SIZE",
    )
    max_chunks_per_document: int = Field(
        default=250,
        ge=1,
        validation_alias="KB_MAX_CHUNKS_PER_DOCUMENT",
    )
    chunk_size_chars: int = Field(
        default=2400,
        ge=500,
        le=20_000,
        validation_alias="KB_CHUNK_SIZE_CHARS",
    )


@lru_cache
def get_settings() -> KnowledgeBaseSettings:
    return KnowledgeBaseSettings()
