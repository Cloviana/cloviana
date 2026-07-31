"""Application errors and HTTP mapping."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class KnowledgeBaseError(Exception):
    status_code = 500
    detail = "Knowledge base request failed."

    def __init__(self, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail


class BadRequestError(KnowledgeBaseError):
    status_code = 400


class NotFoundError(KnowledgeBaseError):
    status_code = 404


class PayloadTooLargeError(KnowledgeBaseError):
    status_code = 413


class ServiceUnavailableError(KnowledgeBaseError):
    status_code = 503


async def knowledge_base_error_handler(
    request: Request,
    exc: KnowledgeBaseError,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(KnowledgeBaseError, knowledge_base_error_handler)
