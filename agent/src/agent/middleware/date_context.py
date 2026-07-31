"""Trusted runtime context added to each model request."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from typing import Any

from langchain.agents.middleware import AgentMiddleware, AgentState, ModelRequest
from langchain_core.messages import SystemMessage

from agent.context import BusinessContext


Clock = Callable[[], datetime]


def _current_time() -> datetime:
    return datetime.now(timezone.utc)


class CurrentDateMiddleware(AgentMiddleware[AgentState, BusinessContext]):
    """Append the current UTC date to every model call."""

    def __init__(self, *, clock: Clock = _current_time) -> None:
        self._clock = clock

    def _prepare_request(
        self,
        request: ModelRequest[BusinessContext],
    ) -> ModelRequest[BusinessContext]:
        runtime = request.runtime
        context = runtime.context if runtime is not None else None
        if not isinstance(context, BusinessContext):
            raise PermissionError("A validated business context is required")

        current_date = self._clock().astimezone(timezone.utc).date()
        date_context = (
            "# Runtime context\n"
            f"Current date: {current_date.isoformat()}\n"
            "Timezone: UTC\n"
            "Interpret relative dates such as today, yesterday, and tomorrow "
            "using this date and timezone."
        )
        system_message = self._append_context(
            request.system_message,
            date_context,
        )
        return request.override(system_message=system_message)

    @staticmethod
    def _append_context(
        message: SystemMessage | None,
        date_context: str,
    ) -> SystemMessage:
        if message is None:
            return SystemMessage(content=date_context)
        if isinstance(message.content, str):
            content = f"{message.content.rstrip()}\n\n{date_context}"
        else:
            content = [
                *message.content,
                {"type": "text", "text": f"\n\n{date_context}"},
            ]
        return message.model_copy(update={"content": content})

    def wrap_model_call(
        self,
        request: ModelRequest[BusinessContext],
        handler: Callable[[ModelRequest[BusinessContext]], Any],
    ) -> Any:
        return handler(self._prepare_request(request))

    async def awrap_model_call(
        self,
        request: ModelRequest[BusinessContext],
        handler: Callable[[ModelRequest[BusinessContext]], Awaitable[Any]],
    ) -> Any:
        return await handler(self._prepare_request(request))
