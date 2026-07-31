"""Per-run cost and loop guards for model and tool calls."""

from __future__ import annotations

from langchain.agents.middleware import (
    AgentMiddleware,
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
)


def build_rate_limit_middleware() -> list[AgentMiddleware]:
    """Return deterministic per-run limits.

    These guards prevent runaway agent loops. Request-per-minute and quota
    enforcement still belong at the authenticated API gateway.
    """

    return [
        ModelCallLimitMiddleware(
            run_limit=10,
            exit_behavior="end",
        ),
        ToolCallLimitMiddleware(
            run_limit=20,
            exit_behavior="continue",
        ),
        ToolCallLimitMiddleware(
            tool_name="query_knowledge_base",
            run_limit=4,
            exit_behavior="continue",
        ),
        ToolCallLimitMiddleware(
            tool_name="web_search",
            run_limit=3,
            exit_behavior="continue",
        ),
        ToolCallLimitMiddleware(
            tool_name="web_extract",
            run_limit=8,
            exit_behavior="continue",
        ),
        ToolCallLimitMiddleware(
            tool_name="task",
            run_limit=2,
            exit_behavior="continue",
        ),
    ]
