"""Document endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Path, Query, UploadFile
from starlette.concurrency import run_in_threadpool

from knowledge_base.api.dependencies import get_ingestion_service
from knowledge_base.schemas import (
    BUSINESS_ID_PATTERN,
    DocumentDeleteResponse,
    DocumentUpdateRequest,
    DocumentUpdateResponse,
    DocumentUploadResponse,
)
from knowledge_base.services.ingestion import IngestionService, safe_filename


router = APIRouter(tags=["documents"])


@router.post("/documents", response_model=DocumentUploadResponse)
async def upload_document(
    file: Annotated[UploadFile, File(...)],
    documentId: Annotated[
        str,
        Form(min_length=1, max_length=128, pattern=BUSINESS_ID_PATTERN),
    ],
    businessId: Annotated[
        str,
        Form(min_length=1, max_length=128, pattern=BUSINESS_ID_PATTERN),
    ],
    folderId: Annotated[str, Form(min_length=1, max_length=128)],
    folderName: Annotated[str, Form(min_length=1, max_length=100)],
    ingestion: Annotated[IngestionService, Depends(get_ingestion_service)],
) -> DocumentUploadResponse:
    filename = safe_filename(file.filename)
    content = await file.read(ingestion.max_file_size + 1)
    await file.close()

    chunks_stored = await run_in_threadpool(
        ingestion.ingest,
        filename=filename,
        content=content,
        document_id=documentId,
        business_id=businessId,
        folder_id=folderId,
        folder_name=folderName,
    )
    return DocumentUploadResponse(
        document_id=documentId,
        business_id=businessId,
        folder_id=folderId,
        folder_name=folderName,
        chunks_stored=chunks_stored,
    )


@router.patch("/documents/{documentId}", response_model=DocumentUpdateResponse)
async def update_document(
    documentId: Annotated[
        str,
        Path(min_length=1, max_length=128, pattern=BUSINESS_ID_PATTERN),
    ],
    request: DocumentUpdateRequest,
    ingestion: Annotated[IngestionService, Depends(get_ingestion_service)],
) -> DocumentUpdateResponse:
    points_updated = await run_in_threadpool(
        ingestion.update_document_folder,
        business_id=request.business_id,
        document_id=documentId,
        folder_id=request.folder_id,
        folder_name=request.folder_name,
    )
    return DocumentUpdateResponse(
        document_id=documentId,
        business_id=request.business_id,
        folder_id=request.folder_id,
        folder_name=request.folder_name,
        points_updated=points_updated,
    )


@router.delete("/documents/{documentId}", response_model=DocumentDeleteResponse)
async def remove_document(
    documentId: Annotated[
        str,
        Path(min_length=1, max_length=128, pattern=BUSINESS_ID_PATTERN),
    ],
    businessId: Annotated[
        str,
        Query(min_length=1, max_length=128, pattern=BUSINESS_ID_PATTERN),
    ],
    ingestion: Annotated[IngestionService, Depends(get_ingestion_service)],
) -> DocumentDeleteResponse:
    points_deleted = await run_in_threadpool(
        ingestion.delete_document,
        business_id=businessId,
        document_id=documentId,
    )
    return DocumentDeleteResponse(
        document_id=documentId,
        business_id=businessId,
        points_deleted=points_deleted,
    )
