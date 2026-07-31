"""Voyage dense embeddings and local sparse BM25 embeddings."""

from __future__ import annotations

import logging
import threading
from typing import Any

import backoff
import httpx

from knowledge_base.settings import KnowledgeBaseSettings, get_settings


logger = logging.getLogger(__name__)

VOYAGE_CONTEXTUAL_EMBEDDINGS_URL = (
    "https://api.voyageai.com/v1/contextualizedembeddings"
)
_MAX_TRIES = 3
_sparse_inference_semaphore = threading.Semaphore(2)


class VoyageEmbeddingError(RuntimeError):
    """Voyage could not produce embeddings for a valid request."""


class Embedder:
    def __init__(
        self,
        *,
        api_key: str,
        model_name: str,
        output_dimension: int,
        timeout_seconds: float,
        request_max_chars: int,
    ) -> None:
        self._api_key = api_key
        self._model_name = model_name
        self._output_dimension = output_dimension
        self._timeout_seconds = timeout_seconds
        self._request_max_chars = request_max_chars
        self._client: httpx.Client | None = None

    @classmethod
    def from_settings(cls, settings: KnowledgeBaseSettings | None = None) -> Embedder:
        settings = settings or get_settings()
        return cls(
            api_key=settings.voyage_api_key or "",
            model_name=settings.embedding_model,
            output_dimension=settings.embedding_dimension,
            timeout_seconds=settings.voyage_timeout_seconds,
            request_max_chars=settings.voyage_request_max_chars,
        )

    def _load(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=self._timeout_seconds)
        return self._client

    def close(self) -> None:
        if self._client is not None:
            self._client.close()

    @staticmethod
    def _is_permanent_error(error: Exception) -> bool:
        if not isinstance(error, httpx.HTTPStatusError):
            return False
        status = error.response.status_code
        return 400 <= status < 500 and status != 429

    @backoff.on_exception(
        backoff.expo,
        httpx.HTTPError,
        max_tries=_MAX_TRIES,
        giveup=_is_permanent_error,
    )
    def _request(self, *, inputs: list[Any], input_type: str) -> Any:
        if not self._api_key:
            raise VoyageEmbeddingError("VOYAGE_API_KEY is not configured.")

        response = self._load().post(
            VOYAGE_CONTEXTUAL_EMBEDDINGS_URL,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "content-type": "application/json",
            },
            json={
                "inputs": inputs,
                "model": self._model_name,
                "input_type": input_type,
                "output_dimension": self._output_dimension,
            },
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError:
            logger.error(
                "Voyage embedding failed: status=%d model=%s input_type=%s body=%s",
                response.status_code,
                self._model_name,
                input_type,
                response.text[:1_000],
            )
            raise
        return response.json()

    @staticmethod
    def _extract_embeddings(data: Any) -> list[list[float]]:
        try:
            outer = data["data"]
            if outer and isinstance(outer[0], dict) and "data" in outer[0]:
                rows = outer[0]["data"]
            else:
                rows = outer
            embeddings = [row["embedding"] for row in rows]
        except (KeyError, IndexError, TypeError) as exc:
            raise VoyageEmbeddingError("Voyage returned an invalid response.") from exc

        if not embeddings or not all(isinstance(vector, list) for vector in embeddings):
            raise VoyageEmbeddingError("Voyage returned no embeddings.")
        return embeddings

    def _embed(self, *, inputs: list[Any], input_type: str, expected: int) -> list[list[float]]:
        try:
            embeddings = self._extract_embeddings(
                self._request(inputs=inputs, input_type=input_type)
            )
        except VoyageEmbeddingError:
            raise
        except httpx.HTTPStatusError as exc:
            raise VoyageEmbeddingError(
                f"Voyage rejected the embedding request with status {exc.response.status_code}."
            ) from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise VoyageEmbeddingError("Voyage is unavailable.") from exc

        if len(embeddings) != expected:
            raise VoyageEmbeddingError(
                f"Voyage returned {len(embeddings)} embeddings for {expected} inputs."
            )
        return embeddings

    def embed_document(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        # Keep large documents below Voyage's per-request token ceiling. Normal
        # documents use one request, so all chunks share document context.
        batches: list[list[str]] = []
        current: list[str] = []
        current_chars = 0
        for text in texts:
            if current and current_chars + len(text) > self._request_max_chars:
                batches.append(current)
                current = []
                current_chars = 0
            current.append(text)
            current_chars += len(text)
        if current:
            batches.append(current)

        embeddings: list[list[float]] = []
        for batch in batches:
            # One nested input means Voyage encodes every chunk in the context
            # of the other chunks from this same document batch.
            embeddings.extend(
                self._embed(
                    inputs=[batch],
                    input_type="document",
                    expected=len(batch),
                )
            )
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        return self._embed(inputs=[text], input_type="query", expected=1)[0]


class SparseEmbedder:
    def __init__(self, *, model_name: str, cache_path: str) -> None:
        self._model_name = model_name
        self._cache_path = cache_path
        self._model: Any = None
        self._lock = threading.Lock()

    @classmethod
    def from_settings(
        cls,
        settings: KnowledgeBaseSettings | None = None,
    ) -> SparseEmbedder:
        settings = settings or get_settings()
        return cls(
            model_name=settings.sparse_embedding_model,
            cache_path=settings.fastembed_cache_path,
        )

    def load(self) -> Any:
        if self._model is None:
            with self._lock:
                if self._model is None:
                    from fastembed import SparseTextEmbedding

                    self._model = SparseTextEmbedding(
                        model_name=self._model_name,
                        cache_dir=self._cache_path,
                    )
        return self._model

    def embed(self, texts: list[str]) -> list[tuple[list[int], list[float]]]:
        if not texts:
            return []
        with _sparse_inference_semaphore:
            return [
                (embedding.indices.tolist(), embedding.values.tolist())
                for embedding in self.load().embed(texts)
            ]
