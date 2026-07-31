"""Search API schemas."""

from __future__ import annotations

from pydantic import Field

from knowledge_base.schemas.shared import BUSINESS_ID_PATTERN, ApiModel


class SearchRequest(ApiModel):
    business_id: str = Field(
        alias="businessId",
        min_length=1,
        max_length=128,
        pattern=BUSINESS_ID_PATTERN,
    )
    query: str = Field(min_length=1, max_length=10_000)
    folder_ids: list[str] | None = Field(
        default=None,
        alias="folderIds",
        max_length=50,
    )
    limit: int = Field(default=20, ge=1, le=50)


class SearchResult(ApiModel):
    text: str
    score: float
    document_id: str = Field(alias="documentId")
    business_id: str = Field(alias="businessId")
    folder_id: str = Field(alias="folderId")
    folder_name: str = Field(alias="folderName")
    filename: str
    chunk_index: int = Field(alias="chunkIndex")
    title: str | None = None
    section: str | None = None
    chunk_context: str | None = Field(default=None, alias="chunkContext")
    okf_type: str | None = Field(default=None, alias="okfType")
    resource: str | None = None
