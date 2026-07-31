"""Unit tests for the production middleware policy."""

from __future__ import annotations

import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock

from langchain.agents.middleware import (
    ModelCallLimitMiddleware,
    ModelRequest,
    ToolCallLimitMiddleware,
    ToolCallRequest,
)
from langchain_core.messages import SystemMessage, ToolMessage
from langgraph.runtime import Runtime

from agent.context import BusinessContext
from agent.middleware.errors import SafeToolErrorMiddleware
from agent.middleware.permissions import (
    BusinessContextGuardMiddleware,
    build_filesystem_permissions,
)
from agent.middleware.rate_limits import build_rate_limit_middleware
from agent.middleware.date_context import CurrentDateMiddleware


def _tool_request() -> ToolCallRequest:
    return ToolCallRequest(
        tool_call={
            "name": "web_search",
            "args": {"query": "test"},
            "id": "call-1",
            "type": "tool_call",
        },
        tool=None,
        state={},
        runtime=Runtime(context=BusinessContext("business-1")),
    )


class BusinessContextGuardTest(unittest.TestCase):
    def test_accepts_valid_business_context(self) -> None:
        middleware = BusinessContextGuardMiddleware()

        result = middleware.before_agent(
            {},
            Runtime(context=BusinessContext("business-1")),
        )

        self.assertIsNone(result)

    def test_rejects_missing_business_context(self) -> None:
        middleware = BusinessContextGuardMiddleware()

        with self.assertRaisesRegex(
            PermissionError,
            "validated business context",
        ):
            middleware.before_agent({}, Runtime(context=None))


class FilesystemPermissionsTest(unittest.TestCase):
    def test_packaged_skills_are_read_only(self) -> None:
        permissions = build_filesystem_permissions()

        self.assertEqual(len(permissions), 1)
        self.assertEqual(permissions[0].operations, ["write"])
        self.assertEqual(permissions[0].paths, ["/skills/**"])
        self.assertEqual(permissions[0].mode, "deny")


class CurrentDateMiddlewareTest(unittest.TestCase):
    def test_appends_utc_date_at_year_boundary(self) -> None:
        instant = datetime(2027, 1, 1, 0, 30, tzinfo=timezone.utc)
        middleware = CurrentDateMiddleware(clock=lambda: instant)
        request = ModelRequest(
            model=MagicMock(),
            messages=[],
            system_message=SystemMessage(content="Static instructions."),
            runtime=Runtime(context=BusinessContext("business-1")),
        )
        captured: list[ModelRequest[BusinessContext]] = []

        middleware.wrap_model_call(
            request,
            lambda prepared: captured.append(prepared),
        )

        content = str(captured[0].system_message.content)
        self.assertTrue(content.startswith("Static instructions."))
        self.assertIn("Current date: 2027-01-01", content)
        self.assertIn("Timezone: UTC", content)

    def test_recomputes_the_date_for_each_model_call(self) -> None:
        instants = iter(
            [
                datetime(2026, 12, 31, 23, 59, tzinfo=timezone.utc),
                datetime(2027, 1, 1, 0, 1, tzinfo=timezone.utc),
            ]
        )
        middleware = CurrentDateMiddleware(clock=lambda: next(instants))
        request = ModelRequest(
            model=MagicMock(),
            messages=[],
            system_message=SystemMessage(content="Static instructions."),
            runtime=Runtime(context=BusinessContext("business-1")),
        )
        dates: list[str] = []

        def capture(prepared: ModelRequest[BusinessContext]) -> None:
            dates.append(str(prepared.system_message.content))

        middleware.wrap_model_call(request, capture)
        middleware.wrap_model_call(request, capture)

        self.assertIn("Current date: 2026-12-31", dates[0])
        self.assertIn("Current date: 2027-01-01", dates[1])


class RateLimitMiddlewareTest(unittest.TestCase):
    def test_limits_model_and_each_expensive_tool(self) -> None:
        middleware = build_rate_limit_middleware()

        model_limits = [
            item
            for item in middleware
            if isinstance(item, ModelCallLimitMiddleware)
        ]
        tool_limits = [
            item
            for item in middleware
            if isinstance(item, ToolCallLimitMiddleware)
        ]

        self.assertEqual(len(model_limits), 1)
        self.assertEqual(model_limits[0].run_limit, 10)
        self.assertEqual(model_limits[0].exit_behavior, "end")
        self.assertEqual(
            {item.tool_name: item.run_limit for item in tool_limits},
            {
                None: 20,
                "query_knowledge_base": 4,
                "web_search": 3,
                "web_extract": 8,
                "task": 2,
            },
        )


class SafeToolErrorMiddlewareTest(unittest.IsolatedAsyncioTestCase):
    def test_returns_handler_result(self) -> None:
        middleware = SafeToolErrorMiddleware()
        expected = ToolMessage(
            content="ok",
            tool_call_id="call-1",
            name="web_search",
        )

        result = middleware.wrap_tool_call(
            _tool_request(),
            lambda _request: expected,
        )

        self.assertIs(result, expected)

    def test_converts_unexpected_sync_error_to_safe_tool_message(self) -> None:
        middleware = SafeToolErrorMiddleware()

        def fail(_request: ToolCallRequest) -> ToolMessage:
            raise RuntimeError("secret provider detail")

        result = middleware.wrap_tool_call(_tool_request(), fail)

        self.assertIsInstance(result, ToolMessage)
        self.assertEqual(result.tool_call_id, "call-1")
        self.assertEqual(result.name, "web_search")
        self.assertEqual(result.status, "error")
        self.assertNotIn("secret provider detail", str(result.content))

    async def test_converts_unexpected_async_error_to_safe_tool_message(
        self,
    ) -> None:
        middleware = SafeToolErrorMiddleware()

        async def fail(_request: ToolCallRequest) -> ToolMessage:
            raise RuntimeError("secret provider detail")

        result = await middleware.awrap_tool_call(_tool_request(), fail)

        self.assertIsInstance(result, ToolMessage)
        self.assertEqual(result.tool_call_id, "call-1")
        self.assertEqual(result.status, "error")
        self.assertNotIn("secret provider detail", str(result.content))


if __name__ == "__main__":
    unittest.main()
