"""Authorization guards and filesystem permissions."""

from __future__ import annotations

from typing import Any

from deepagents import FilesystemPermission
from langchain.agents.middleware import AgentMiddleware, AgentState
from langgraph.runtime import Runtime

from agent.context import BusinessContext


class BusinessContextGuardMiddleware(
    AgentMiddleware[AgentState, BusinessContext]
):
    """Reject invocations that lack validated, trusted tenant context."""

    @staticmethod
    def _validate(runtime: Runtime[BusinessContext]) -> None:
        context = runtime.context
        if not isinstance(context, BusinessContext):
            raise PermissionError("A validated business context is required")
        if not context.business_id:
            raise PermissionError("A validated business ID is required")

    def before_agent(
        self,
        state: AgentState,
        runtime: Runtime[BusinessContext],
    ) -> dict[str, Any] | None:
        self._validate(runtime)
        return None

    async def abefore_agent(
        self,
        state: AgentState,
        runtime: Runtime[BusinessContext],
    ) -> dict[str, Any] | None:
        self._validate(runtime)
        return None


def build_filesystem_permissions() -> list[FilesystemPermission]:
    """Keep packaged skills immutable while allowing scratch and memory files."""

    return [
        FilesystemPermission(
            operations=["write"],
            paths=["/skills/**"],
            mode="deny",
        )
    ]
