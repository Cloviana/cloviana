"""Search endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from starlette.concurrency import run_in_threadpool

from knowledge_base.api.dependencies import get_retrieval_service
from knowledge_base.schemas import SearchRequest, SearchResult
from knowledge_base.services.retrieval import RetrievalService


router = APIRouter(tags=["search"])


@router.post("/search", response_model=list[SearchResult])
async def search_documents(
    request: SearchRequest,
    retrieval: Annotated[RetrievalService, Depends(get_retrieval_service)],
) -> list[SearchResult]:
    results = await run_in_threadpool(retrieval.search, request)
    return [SearchResult(**result) for result in results]
