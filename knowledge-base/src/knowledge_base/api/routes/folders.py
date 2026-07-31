"""Folder metadata endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path
from starlette.concurrency import run_in_threadpool

from knowledge_base.api.dependencies import get_ingestion_service
from knowledge_base.schemas import FolderUpdateRequest, FolderUpdateResponse
from knowledge_base.services.ingestion import IngestionService


router = APIRouter(tags=["folders"])


@router.patch("/folders/{folderId}", response_model=FolderUpdateResponse)
async def update_folder(
    folderId: Annotated[str, Path(min_length=1, max_length=128)],
    request: FolderUpdateRequest,
    ingestion: Annotated[IngestionService, Depends(get_ingestion_service)],
) -> FolderUpdateResponse:
    points_updated = await run_in_threadpool(
        ingestion.update_folder_name,
        business_id=request.business_id,
        folder_id=folderId,
        folder_name=request.folder_name,
    )
    return FolderUpdateResponse(
        folder_id=folderId,
        business_id=request.business_id,
        folder_name=request.folder_name,
        points_updated=points_updated,
    )
