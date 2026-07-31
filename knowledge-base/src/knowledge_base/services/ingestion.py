"""Document ingestion use cases."""

from __future__ import annotations

from pathlib import Path

from knowledge_base.api.errors import (
    BadRequestError,
    NotFoundError,
    PayloadTooLargeError,
    ServiceUnavailableError,
)
from knowledge_base.infrastructure.chunker import chunk_markdown
from knowledge_base.infrastructure.embeddings import (
    Embedder,
    SparseEmbedder,
    VoyageEmbeddingError,
)
from knowledge_base.infrastructure.okf import normalize_to_okf
from knowledge_base.infrastructure.parser import DocumentParser, UnstructuredParseError
from knowledge_base.infrastructure.qdrant import QdrantStore
from knowledge_base.settings import KnowledgeBaseSettings, get_settings


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".md", ".markdown", ".txt"}
# Keep optional frontmatter descriptions from overwhelming the actual chunk text.
OKF_DESCRIPTION_MAX_CHARS = 200


def safe_filename(filename: str | None) -> str:
    return (filename or "upload").replace("\\", "/").rsplit("/", 1)[-1]


def _normalized_folder(folder_id: str, folder_name: str) -> tuple[str, str]:
    folder_id = folder_id.strip()
    folder_name = " ".join(folder_name.split())
    if not folder_id or not folder_name:
        raise BadRequestError("folderId and folderName are required.")
    return folder_id, folder_name


class IngestionService:
    def __init__(
        self,
        *,
        embedder: Embedder,
        sparse_embedder: SparseEmbedder,
        store: QdrantStore,
        parser: DocumentParser,
        settings: KnowledgeBaseSettings | None = None,
    ) -> None:
        self._embedder = embedder
        self._sparse_embedder = sparse_embedder
        self._store = store
        self._parser = parser
        self._settings = settings or get_settings()

    @property
    def max_file_size(self) -> int:
        return self._settings.max_file_size

    def ingest(
        self,
        *,
        filename: str,
        content: bytes,
        document_id: str,
        business_id: str,
        folder_id: str,
        folder_name: str,
    ) -> int:
        folder_id, folder_name = _normalized_folder(folder_id, folder_name)
        if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
            raise BadRequestError(
                "Unsupported file type. Only PDF, DOCX, Markdown, and TXT are allowed."
            )
        if len(content) > self.max_file_size:
            raise PayloadTooLargeError("File exceeds the 5 MB limit.")

        try:
            markdown = self._parser.parse_file(filename, content)
            okf = normalize_to_okf(
                filename,
                markdown,
                document_id,
                business_id,
                folder_id,
                folder_name,
            )
            chunks = chunk_markdown(okf.body, okf.title, self._settings)
        except UnstructuredParseError as exc:
            raise ServiceUnavailableError(str(exc)) from exc
        except ValueError as exc:
            raise BadRequestError(str(exc)) from exc

        if not chunks:
            raise BadRequestError("No readable text found in file.")
        if len(chunks) > self._settings.max_chunks_per_document:
            raise PayloadTooLargeError(
                "Document is too large after parsing; "
                f"the maximum is {self._settings.max_chunks_per_document} chunks."
            )

        metadata = okf.qdrant_metadata()
        description = metadata.get("description") or ""
        if len(description) > OKF_DESCRIPTION_MAX_CHARS:
            description = description[:OKF_DESCRIPTION_MAX_CHARS].rstrip() + "…"
        okf_context = "\n".join(
            f"{key}: {value}"
            for key, value in (
                ("Type", metadata.get("okfType")),
                ("Description", description),
            )
            if value
        )
        embedding_texts = [
            "\n".join(part for part in (okf_context, chunk.embedding_text) if part).strip()
            for chunk in chunks
        ]
        try:
            dense_vectors = self._embedder.embed_document(embedding_texts)
        except VoyageEmbeddingError as exc:
            raise ServiceUnavailableError(str(exc)) from exc
        sparse_vectors = self._sparse_embedder.embed(embedding_texts)
        return self._store.replace_document(
            business_id=business_id,
            document_id=document_id,
            folder_id=folder_id,
            folder_name=folder_name,
            filename=filename,
            chunks=[
                {
                    "text": chunk.text,
                    "section": chunk.section,
                    "context": f"Title: {okf.title}\nSection: {chunk.section}",
                }
                for chunk in chunks
            ],
            dense_embeddings=dense_vectors,
            sparse_embeddings=sparse_vectors,
            okf_metadata=metadata,
        )

    def update_document_folder(
        self,
        *,
        business_id: str,
        document_id: str,
        folder_id: str,
        folder_name: str,
    ) -> int:
        folder_id, folder_name = _normalized_folder(folder_id, folder_name)
        points_updated = self._store.update_document_folder(
            business_id,
            document_id,
            folder_id,
            folder_name,
        )
        if points_updated == 0:
            raise NotFoundError("Document not found.")
        return points_updated

    def update_folder_name(
        self,
        *,
        business_id: str,
        folder_id: str,
        folder_name: str,
    ) -> int:
        folder_id, folder_name = _normalized_folder(folder_id, folder_name)
        return self._store.update_folder_name(
            business_id,
            folder_id,
            folder_name,
        )

    def delete_document(self, *, business_id: str, document_id: str) -> int:
        points_deleted = self._store.delete_document(business_id, document_id)
        if points_deleted == 0:
            raise NotFoundError("Document not found.")
        return points_deleted
