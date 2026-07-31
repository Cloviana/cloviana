"""Private FastAPI adapter for Cloviana's ask-only chat service."""

from __future__ import annotations

import logging
import re
import secrets
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, Path, Request, status
from fastapi.responses import StreamingResponse
from langgraph.store.base import BaseStore

from agent.agents.assistant import build_assistant
from agent.api.reasoning_summarizer import ModelReasoningSummarizer
from agent.api.schemas import (
    AgentGraph,
    ChatMessagesRequest,
    ChatRequest,
    ChatResponse,
    ChatRuntimeRequest,
    WorkspaceResponse,
)
from agent.api.stream_accumulator import _StreamAccumulator, _sse
from agent.context import BusinessContext
from agent.settings import get_settings


logger = logging.getLogger(__name__)

__all__ = [
    "AgentGraph",
    "ChatMessagesRequest",
    "ChatRequest",
    "ChatResponse",
    "ChatRuntimeRequest",
    "ModelReasoningSummarizer",
    "WorkspaceResponse",
    "create_app",
    "app",
]


def _invocation(request: ChatRequest) -> tuple[dict[str, Any], dict[str, Any]]:
    state = {
        "messages": [
            {
                "role": message.role,
                # Multimodal content goes to the model as plain OpenAI-style
                # part dicts; plain text stays a string.
                "content": message.content
                if isinstance(message.content, str)
                else [part.model_dump() for part in message.content],
            }
            for message in request.messages
        ]
    }
    config = {"configurable": {"thread_id": request.chat_id}}
    return state, config


async def _chat_events(
    graph: AgentGraph,
    chat_request: ChatRequest,
) -> AsyncIterator[str]:
    state, config = _invocation(chat_request)
    context = BusinessContext(chat_request.business_id)
    accumulator = _StreamAccumulator(chat_request, None)

    logger.info(
        "Agent stream starting business=%s chat=%s",
        chat_request.business_id,
        chat_request.chat_id,
    )
    try:
        part_count = 0
        async for part in graph.astream(
            state,
            config=config,
            context=context,
            stream_mode=["messages", "updates"],
            subgraphs=False,
            version="v2",
        ):
            part_count += 1
            if part_count == 1:
                logger.info(
                    "Agent stream received first part business=%s chat=%s",
                    chat_request.business_id,
                    chat_request.chat_id,
                )
            if not isinstance(part, dict):
                continue
            async for event in accumulator.process(part):
                yield event

        logger.info(
            "Agent stream loop finished business=%s chat=%s parts=%d",
            chat_request.business_id,
            chat_request.chat_id,
            part_count,
        )
        response = accumulator.final_response()
        if not response:
            raise RuntimeError("Agent completed without an assistant response")
        yield _sse("done", {"response": response, "actions": accumulator.actions})
    except Exception:
        logger.exception(
            "Agent stream failed for business=%s chat=%s",
            chat_request.business_id,
            chat_request.chat_id,
        )
        yield _sse("error", {"detail": "Agent request failed"})


@asynccontextmanager
async def _store() -> AsyncIterator[BaseStore]:
    database_url = get_settings().database_url.get_secret_value()

    from langgraph.store.postgres import AsyncPostgresStore

    async with AsyncPostgresStore.from_conn_string(
        database_url,
        pool_config={
            "min_size": 1,
            "max_size": 5,
            # Reap idle connections instead of pinning them open forever.
            "max_idle": 300,
            "kwargs": {"prepare_threshold": None},
        },
    ) as store:
        yield store


def create_app(
    *,
    graph: AgentGraph | None = None,
    internal_token: str | None = None,
) -> FastAPI:
    """Create the service, with injectable dependencies for isolated tests."""

    configured_token = (
        internal_token
        if internal_token is not None
        else get_settings().agent_internal_token.get_secret_value()
    )
    # Fail closed in every environment: an unset token must never mean
    # unauthenticated access to an agent that can execute code.
    if not configured_token:
        raise RuntimeError(
            "AGENT_INTERNAL_TOKEN must be set to a non-empty value"
        )

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        if graph is not None:
            application.state.graph = graph
            yield
            return
        async with _store() as store:
            application.state.graph = build_assistant(store=store)
            yield

    application = FastAPI(
        title="Cloviana Agent",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan,
    )
    if graph is not None:
        application.state.graph = graph
    application.state.internal_token = configured_token

    async def authorize(
        supplied_token: Annotated[
            str | None,
            Header(alias="x-agent-internal-token"),
        ] = None,
        request: Request = None,  # type: ignore[assignment]
    ) -> None:
        expected_token = getattr(request.app.state, "internal_token", "")
        if expected_token and (
            supplied_token is None
            or not secrets.compare_digest(supplied_token, expected_token)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid internal service token",
            )

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.delete(
        "/agent/chats/{chat_id}/runtime",
        response_model=WorkspaceResponse,
        dependencies=[Depends(authorize)],
    )
    async def cleanup_workspace(
        body: ChatRuntimeRequest,
        chat_id: Annotated[str, Path(min_length=1, max_length=256)],
    ) -> WorkspaceResponse:
        _ = body, chat_id
        return WorkspaceResponse(status="ok")

    @application.post(
        "/agent/chats/{chat_id}/messages/stream",
        dependencies=[Depends(authorize)],
    )
    async def chat_stream(
        body: ChatMessagesRequest,
        chat_id: Annotated[str, Path(min_length=1, max_length=256)],
        request: Request,
    ) -> StreamingResponse:
        chat_request = body.to_chat_request(chat_id)
        return StreamingResponse(
            _chat_events(
                request.app.state.graph,
                chat_request,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    return application


# psycopg embeds the full conninfo (password included) in connection errors,
# which its pool then logs. Scrub credentials on the way out of every handler.
_CREDENTIALS = re.compile(
    r"(?<=://)([^/\s:@]+):[^/\s@]+(?=@)"  # scheme://user:password@host
    r"|(?<=password=)[^\s'\"]+"  # keyword conninfo: password=...
)


class _RedactCredentials(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        redacted = _CREDENTIALS.sub(
            lambda m: f"{m.group(1)}:***" if m.group(1) else "***", message
        )
        if redacted != message:
            record.msg = redacted
            record.args = ()
        return True


logging.basicConfig(level=logging.INFO)

# Filters on a logger only see records logged directly to it, not propagated
# ones, so attach to the root handler instead.
for _handler in logging.getLogger().handlers:
    _handler.addFilter(_RedactCredentials())

app = create_app()
