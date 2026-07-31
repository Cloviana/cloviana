"""Document API schemas."""

from __future__ import annotations

from pydantic import Field

from knowledge_base.schemas.shared import BUSINESS_ID_PATTERN, ApiModel


class DocumentUploadResponse(ApiModel):
    document_id: str = Field(alias="documentId")
    business_id: str = Field(alias="businessId")
    folder_id: str = Field(alias="folderId")
    folder_name: str = Field(alias="folderName")
    chunks_stored: int = Field(alias="chunksStored")


class DocumentUpdateRequest(ApiModel):
    business_id: str = Field(
        alias="businessId",
        min_length=1,
        max_length=128,
        pattern=BUSINESS_ID_PATTERN,
    )
    folder_id: str = Field(alias="folderId", min_length=1, max_length=128)
    folder_name: str = Field(alias="folderName", min_length=1, max_length=100)


class DocumentUpdateResponse(ApiModel):
    document_id: str = Field(alias="documentId")
    business_id: str = Field(alias="businessId")
    folder_id: str = Field(alias="folderId")
    folder_name: str = Field(alias="folderName")
    points_updated: int = Field(alias="pointsUpdated")


class DocumentDeleteResponse(ApiModel):
    document_id: str = Field(alias="documentId")
    business_id: str = Field(alias="businessId")
    points_deleted: int = Field(alias="pointsDeleted")


class FolderUpdateRequest(ApiModel):
    business_id: str = Field(
        alias="businessId",
        min_length=1,
        max_length=128,
        pattern=BUSINESS_ID_PATTERN,
    )
    folder_name: str = Field(alias="folderName", min_length=1, max_length=100)


class FolderUpdateResponse(ApiModel):
    folder_id: str = Field(alias="folderId")
    business_id: str = Field(alias="businessId")
    folder_name: str = Field(alias="folderName")
    points_updated: int = Field(alias="pointsUpdated")
