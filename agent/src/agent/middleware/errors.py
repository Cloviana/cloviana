"""Safe handling for unexpected tool execution failures."""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable

from langchain.agents.middleware import AgentMiddleware, ToolCallRequest
from langchain_core.messages import ToolMessage
from langgraph.errors import GraphBubbleUp
from langgraph.types import Command


logger = logging.getLogger(__name__)

_SAFE_ERROR_MESSAGE = (
    "The tool failed unexpectedly. Continue without it or explain that the "
    "requested operation is temporarily unavailable."
)


class SafeToolErrorMiddleware(AgentMiddleware):
    """Log unexpected failures while returning a safe error to the model."""

    @staticmethod
    def _error_message(request: ToolCallRequest) -> ToolMessage:
        tool_call = request.tool_call
        return ToolMessage(
            content=_SAFE_ERROR_MESSAGE,
            tool_call_id=str(tool_call["id"]),
            name=str(tool_call["name"]),
            status="error",
        )

    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
    ) -> ToolMessage | Command:
        try:
            return handler(request)
        except GraphBubbleUp:
            raise
        except Exception as exc:
            logger.error(
                "Unexpected tool failure: tool=%s error_type=%s",
                request.tool_call.get("name", "unknown"),
                type(exc).__name__,
            )
            return self._error_message(request)

    async def awrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[
            [ToolCallRequest],
            Awaitable[ToolMessage | Command],
        ],
    ) -> ToolMessage | Command:
        try:
            return await handler(request)
        except GraphBubbleUp:
            raise
        except Exception as exc:
            logger.error(
                "Unexpected async tool failure: tool=%s error_type=%s",
                request.tool_call.get("name", "unknown"),
                type(exc).__name__,
            )
            return self._error_message(request)
