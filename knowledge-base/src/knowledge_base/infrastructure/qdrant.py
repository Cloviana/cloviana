"""Qdrant storage adapter."""

from __future__ import annotations

import logging
import re
import threading
import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

from knowledge_base.settings import KnowledgeBaseSettings, get_settings


logger = logging.getLogger(__name__)

BUSINESS_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
POINT_NAMESPACE = uuid.UUID("d472cb13-6a19-47ea-a402-c8717b311c15")
DENSE_VECTOR = "dense"
SPARSE_VECTOR = "sparse"
_UPSERT_BATCH_SIZE = 256


def collection_name(business_id: str, prefix: str = "kb") -> str:
    if not BUSINESS_ID_RE.fullmatch(business_id):
        raise ValueError(
            "businessId must contain only letters, numbers, underscores, or hyphens."
        )
    return f"{prefix}_{business_id}"


def _is_not_found(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    message = str(exc).lower()
    return status_code == 404 or "404" in message or "not found" in message


def _filter(*conditions: models.FieldCondition) -> models.Filter:
    return models.Filter(must=list(conditions))


def _business_condition(business_id: str) -> models.FieldCondition:
    return models.FieldCondition(
        key="businessId",
        match=models.MatchValue(value=business_id),
    )


def _document_filter(business_id: str, document_id: str) -> models.Filter:
    return _filter(
        _business_condition(business_id),
        models.FieldCondition(
            key="documentId",
            match=models.MatchValue(value=document_id),
        ),
    )


def _folder_filter(business_id: str, folder_id: str) -> models.Filter:
    return _filter(
        _business_condition(business_id),
        models.FieldCondition(
            key="folderId",
            match=models.MatchValue(value=folder_id),
        ),
    )


def _search_filter(
    business_id: str,
    folder_ids: list[str] | None,
) -> models.Filter:
    conditions = [_business_condition(business_id)]
    if folder_ids:
        conditions.append(
            models.FieldCondition(
                key="folderId",
                match=models.MatchAny(any=folder_ids),
            )
        )
    return _filter(*conditions)


def _point_id(business_id: str, document_id: str, chunk_index: int) -> str:
    return str(uuid.uuid5(POINT_NAMESPACE, f"{business_id}:{document_id}:{chunk_index}"))


class QdrantStore:
    def __init__(
        self,
        *,
        client: QdrantClient,
        min_score: float,
        collection_prefix: str,
    ) -> None:
        self._client = client
        self._min_score = min_score
        self._collection_prefix = collection_prefix
        self._collection_lock = threading.Lock()

    @classmethod
    def from_settings(cls, settings: KnowledgeBaseSettings | None = None) -> QdrantStore:
        settings = settings or get_settings()
        return cls(
            client=QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port),
            min_score=settings.kb_min_score,
            collection_prefix=settings.qdrant_collection_prefix,
        )

    def _collection_name(self, business_id: str) -> str:
        return collection_name(business_id, self._collection_prefix)

    def close(self) -> None:
        self._client.close()

    def _collection_exists(self, name: str) -> bool:
        try:
            self._client.get_collection(collection_name=name)
            return True
        except Exception as exc:
            if _is_not_found(exc):
                return False
            raise

    def ensure_collection(self, business_id: str, vector_size: int) -> str:
        with self._collection_lock:
            return self._ensure_collection(business_id, vector_size)

    def _ensure_collection(self, business_id: str, vector_size: int) -> str:
        name = self._collection_name(business_id)
        if not self._collection_exists(name):
            try:
                self._client.create_collection(
                    collection_name=name,
                    vectors_config={
                        DENSE_VECTOR: models.VectorParams(
                            size=vector_size,
                            distance=models.Distance.COSINE,
                        ),
                    },
                    sparse_vectors_config={
                        SPARSE_VECTOR: models.SparseVectorParams(
                            modifier=models.Modifier.IDF,
                        ),
                    },
                )
            except UnexpectedResponse:
                if not self._collection_exists(name):
                    raise

        info = self._client.get_collection(collection_name=name)
        dense_vectors = info.config.params.vectors
        sparse_vectors = info.config.params.sparse_vectors
        if (
            not isinstance(dense_vectors, dict)
            or DENSE_VECTOR not in dense_vectors
            or not isinstance(sparse_vectors, dict)
            or SPARSE_VECTOR not in sparse_vectors
        ):
            raise RuntimeError(f"Collection {name!r} is missing dense/sparse vectors.")
        current_size = dense_vectors[DENSE_VECTOR].size
        if current_size != vector_size:
            raise RuntimeError(
                f"Collection {name!r} uses {current_size}-dimension vectors, "
                f"but the configured embedding model produces {vector_size}."
            )

        payload_schema = info.payload_schema or {}
        for field in ("documentId", "businessId", "folderId"):
            if field in payload_schema:
                continue
            self._client.create_payload_index(
                collection_name=name,
                field_name=field,
                field_schema=models.PayloadSchemaType.KEYWORD,
                wait=True,
            )
        return name

    def _scroll(
        self,
        name: str,
        scroll_filter: models.Filter,
        *,
        with_vectors: bool,
    ) -> list[models.Record]:
        if not self._collection_exists(name):
            return []

        records: list[models.Record] = []
        offset = None
        while True:
            page, offset = self._client.scroll(
                collection_name=name,
                scroll_filter=scroll_filter,
                limit=256,
                offset=offset,
                with_payload=True,
                with_vectors=with_vectors,
            )
            records.extend(page)
            if offset is None:
                return records

    def _delete_ids(self, name: str, point_ids: list[str | int]) -> None:
        if not point_ids or not self._collection_exists(name):
            return
        self._client.delete(
            collection_name=name,
            points_selector=models.PointIdsList(points=point_ids),
            wait=True,
        )

    def replace_document(
        self,
        business_id: str,
        document_id: str,
        folder_id: str,
        folder_name: str,
        filename: str,
        chunks: list[dict[str, str]],
        dense_embeddings: list[list[float]],
        sparse_embeddings: list[tuple[list[int], list[float]]],
        okf_metadata: dict[str, Any],
    ) -> int:
        if (
            not chunks
            or len(chunks) != len(dense_embeddings)
            or len(chunks) != len(sparse_embeddings)
        ):
            raise ValueError(
                "Chunks and embeddings must be non-empty and have matching lengths."
            )

        name = self.ensure_collection(business_id, len(dense_embeddings[0]))
        old_records = self._scroll(
            name,
            _document_filter(business_id, document_id),
            with_vectors=False,
        )

        points: list[models.PointStruct] = []
        new_ids: set[str] = set()
        for index, (chunk, dense_vector, sparse_vector) in enumerate(
            zip(chunks, dense_embeddings, sparse_embeddings)
        ):
            point_id = _point_id(business_id, document_id, index)
            new_ids.add(point_id)
            payload = {
                "documentId": document_id,
                "businessId": business_id,
                "folderId": folder_id,
                "folderName": folder_name,
                "filename": filename,
                "chunkIndex": index,
                "text": chunk["text"],
                "section": chunk["section"],
                **okf_metadata,
            }
            if chunk.get("context"):
                payload["chunkContext"] = chunk["context"]
            indices, values = sparse_vector
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector={
                        DENSE_VECTOR: dense_vector,
                        SPARSE_VECTOR: models.SparseVector(
                            indices=indices,
                            values=values,
                        ),
                    },
                    payload=payload,
                )
            )

        for start in range(0, len(points), _UPSERT_BATCH_SIZE):
            self._client.upsert(
                collection_name=name,
                points=points[start : start + _UPSERT_BATCH_SIZE],
                wait=True,
            )

        stale_ids = [
            record.id for record in old_records if str(record.id) not in new_ids
        ]
        self._delete_stale_ids(name, stale_ids)
        return len(points)

    def _delete_stale_ids(self, name: str, ids: list[Any]) -> None:
        if not ids:
            return
        for attempt in (1, 2):
            try:
                self._delete_ids(name, ids)
                return
            except Exception:
                if attempt == 2:
                    logger.exception(
                        "Failed to delete %d stale point(s) from %s; "
                        "they will be removed on the next ingestion",
                        len(ids),
                        name,
                    )

    def update_document_folder(
        self,
        business_id: str,
        document_id: str,
        folder_id: str,
        folder_name: str,
    ) -> int:
        name = self._collection_name(business_id)
        records = self._scroll(
            name,
            _document_filter(business_id, document_id),
            with_vectors=False,
        )
        if not records:
            return 0
        self._client.set_payload(
            collection_name=name,
            payload={"folderId": folder_id, "folderName": folder_name},
            points=[record.id for record in records],
            wait=True,
        )
        return len(records)

    def update_folder_name(
        self,
        business_id: str,
        folder_id: str,
        folder_name: str,
    ) -> int:
        name = self._collection_name(business_id)
        records = self._scroll(
            name,
            _folder_filter(business_id, folder_id),
            with_vectors=False,
        )
        if not records:
            return 0
        self._client.set_payload(
            collection_name=name,
            payload={"folderName": folder_name},
            points=[record.id for record in records],
            wait=True,
        )
        return len(records)

    def delete_document(self, business_id: str, document_id: str) -> int:
        name = self._collection_name(business_id)
        records = self._scroll(
            name,
            _document_filter(business_id, document_id),
            with_vectors=False,
        )
        self._delete_ids(name, [record.id for record in records])
        return len(records)

    def search(
        self,
        business_id: str,
        dense_vector: list[float],
        sparse_vector: tuple[list[int], list[float]],
        folder_ids: list[str] | None,
        candidates: int,
    ) -> list[dict[str, Any]]:
        name = self._collection_name(business_id)
        if not self._collection_exists(name):
            return []

        indices, values = sparse_vector
        search_filter = _search_filter(business_id, folder_ids)
        response = self._client.query_points(
            collection_name=name,
            prefetch=[
                models.Prefetch(
                    query=dense_vector,
                    using=DENSE_VECTOR,
                    filter=search_filter,
                    score_threshold=self._min_score,
                    limit=candidates,
                ),
                models.Prefetch(
                    query=models.SparseVector(indices=indices, values=values),
                    using=SPARSE_VECTOR,
                    filter=search_filter,
                    limit=candidates,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=candidates,
            with_payload=True,
        )

        results: list[dict[str, Any]] = []
        for point in response.points:
            payload = point.payload or {}
            results.append(
                {
                    "text": payload.get("text", ""),
                    "score": point.score,
                    "document_id": payload.get("documentId", ""),
                    "business_id": payload.get("businessId", ""),
                    "folder_id": payload.get("folderId", ""),
                    "folder_name": payload.get("folderName", ""),
                    "filename": payload.get("filename", ""),
                    "chunk_index": payload.get("chunkIndex", 0),
                    "title": payload.get("title"),
                    "section": payload.get("section"),
                    "chunk_context": payload.get("chunkContext"),
                    "okf_type": payload.get("okfType"),
                    "resource": payload.get("resource"),
                }
            )
        return results
