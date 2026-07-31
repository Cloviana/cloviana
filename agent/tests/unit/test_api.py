"""Contract tests for the private ask-only FastAPI service."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from typing import Any
from unittest.mock import patch

from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, AIMessageChunk, ToolMessage

from agent.api import (
    ChatRequest,
    ModelReasoningSummarizer,
    create_app,
)
from agent.context import BusinessContext


REQUEST = {
    "businessId": "business-1",
    "chatId": "chat-1",
    "messages": [{"role": "user", "content": "What changed?"}],
}
STREAM_REQUEST = {
    "businessId": "business-1",
    "messages": [{"role": "user", "content": "What changed?"}],
}


class FakeGraph:
    def __init__(self) -> None:
        self.invocations: list[dict[str, Any]] = []

    async def ainvoke(
        self,
        state: dict[str, Any],
        **kwargs: Any,
    ) -> dict[str, Any]:
        self.invocations.append({"state": state, **kwargs})
        return {
            "messages": [
                *state["messages"],
                AIMessage(content="The concise answer."),
            ]
        }

    async def astream(self, *args: Any, **kwargs: Any):
        self.invocations.append({"state": args[0], **kwargs})
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [
                        AIMessage(
                            content="",
                            tool_calls=[
                                {
                                    "name": "web_search",
                                    "args": {"query": "latest change"},
                                    "id": "call-1",
                                    "type": "tool_call",
                                }
                            ],
                        )
                    ]
                }
            },
        }
        yield {
            "type": "updates",
            "data": {
                "tools": {
                    "messages": [
                        ToolMessage(
                            content="result",
                            tool_call_id="call-1",
                            name="web_search",
                            artifact={
                                "results": [
                                    {
                                        "title": "Primary source",
                                        "url": "https://example.com/source",
                                        "source": "example.com",
                                    }
                                ]
                            },
                        )
                    ]
                }
            },
        }
        yield {
            "type": "messages",
            "data": (AIMessageChunk(content="The answer."), {}),
        }
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [AIMessage(content="The answer.")],
                }
            },
        }


class FakeReasoningSummarizer:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    async def astream(self, **kwargs: Any):
        self.calls.append(kwargs)
        yield "Reasoning "
        yield f"phase {len(self.calls)}."


class AsyncChunks:
    def __init__(self, *texts: str) -> None:
        self._chunks = iter(texts)

    def __aiter__(self) -> AsyncChunks:
        return self

    async def __anext__(self) -> Any:
        try:
            text = next(self._chunks)
        except StopIteration as exc:
            raise StopAsyncIteration from exc
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    delta=SimpleNamespace(content=text),
                )
            ]
        )


class RecordingCompletions:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    async def create(self, **kwargs: Any) -> AsyncChunks:
        self.calls.append(kwargs)
        return AsyncChunks("Researching ", "the sources.")


class ModelReasoningSummarizerTest(unittest.IsolatedAsyncioTestCase):
    async def test_streams_provider_output(self) -> None:
        completions = RecordingCompletions()
        client = SimpleNamespace(
            chat=SimpleNamespace(completions=completions)
        )
        summarizer = ModelReasoningSummarizer(
            client=client,
            model="openai/gpt-oss-20b",
        )

        chunks = [
            text
            async for text in summarizer.astream(
                chat_request=ChatRequest.model_validate(REQUEST),
                tool_calls=[
                    {
                        "name": "web_search",
                        "args": {"query": "latest"},
                    }
                ],
                previous_reasoning=[],
                recent_tool_results=[],
            )
        ]

        self.assertEqual(chunks, ["Researching ", "the sources."])
        self.assertEqual(len(completions.calls), 1)
        call = completions.calls[0]
        self.assertEqual(call["model"], "openai/gpt-oss-20b")
        self.assertIs(call["stream"], True)


class TwoPhaseGraph(FakeGraph):
    async def astream(self, *args: Any, **kwargs: Any):
        self.invocations.append({"state": args[0], **kwargs})
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [
                        AIMessage(
                            content="",
                            tool_calls=[
                                {
                                    "name": "query_knowledge_base",
                                    "args": {"query": "GEO"},
                                    "id": "call-1",
                                    "type": "tool_call",
                                }
                            ],
                        )
                    ]
                }
            },
        }
        yield {
            "type": "updates",
            "data": {
                "tools": {
                    "messages": [
                        ToolMessage(
                            content="result",
                            tool_call_id="call-1",
                            name="query_knowledge_base",
                            artifact={
                                "results": [
                                    {
                                        "title": "The Six GEO Primitives",
                                        "source": "GEO.docx",
                                    }
                                ]
                            },
                        )
                    ]
                }
            },
        }
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [
                        AIMessage(
                            content="",
                            tool_calls=[
                                {
                                    "name": "web_search",
                                    "args": {"query": "GEO 2026"},
                                    "id": "call-2",
                                    "type": "tool_call",
                                }
                            ],
                        )
                    ]
                }
            },
        }
        yield {
            "type": "updates",
            "data": {
                "tools": {
                    "messages": [
                        ToolMessage(
                            content="result",
                            tool_call_id="call-2",
                            name="web_search",
                            artifact={"results": []},
                        )
                    ]
                }
            },
        }
        yield {
            "type": "messages",
            "data": (AIMessageChunk(content="The answer."), {}),
        }
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [AIMessage(content="The answer.")],
                }
            },
        }


class WorkspaceToolsGraph(FakeGraph):
    async def astream(self, *args: Any, **kwargs: Any):
        self.invocations.append({"state": args[0], **kwargs})
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [
                        AIMessage(
                            content="",
                            tool_calls=[
                                {
                                    "name": "ls",
                                    "args": {},
                                    "id": "hidden-1",
                                    "type": "tool_call",
                                },
                                {
                                    "name": "glob",
                                    "args": {"pattern": "*.md"},
                                    "id": "hidden-2",
                                    "type": "tool_call",
                                },
                                {
                                    "name": "read_file",
                                    "args": {"path": "README.md"},
                                    "id": "call-file",
                                    "type": "tool_call",
                                },
                            ],
                        )
                    ]
                }
            },
        }
        yield {
            "type": "updates",
            "data": {
                "tools": {
                    "messages": [
                        ToolMessage(
                            content="README.md",
                            tool_call_id="hidden-1",
                            name="ls",
                        ),
                        ToolMessage(
                            content="README.md",
                            tool_call_id="hidden-2",
                            name="glob",
                        ),
                        ToolMessage(
                            content="# Project",
                            tool_call_id="call-file",
                            name="read_file",
                        ),
                    ]
                }
            },
        }
        yield {
            "type": "messages",
            "data": (AIMessageChunk(content="The answer."), {}),
        }
        yield {
            "type": "updates",
            "data": {
                "model": {
                    "messages": [AIMessage(content="The answer.")],
                }
            },
        }


class ApiContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.graph = FakeGraph()
        self.summarizer = FakeReasoningSummarizer()
        self.client = TestClient(
            create_app(
                graph=self.graph,
                internal_token="service-secret",
                reasoning_summarizer=self.summarizer,
            )
        )
        self.headers = {"x-agent-internal-token": "service-secret"}

    def tearDown(self) -> None:
        self.client.close()

    def test_health_does_not_require_service_authentication(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_chat_rejects_missing_internal_token(self) -> None:
        response = self.client.post("/agent/chat", json=REQUEST)

        self.assertEqual(response.status_code, 401)

    def test_chat_invokes_graph_with_trusted_business_context(self) -> None:
        response = self.client.post(
            "/agent/chat",
            json=REQUEST,
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"response": "The concise answer.", "actions": []},
        )
        invocation = self.graph.invocations[-1]
        self.assertEqual(
            invocation["config"]["configurable"]["thread_id"],
            "chat-1",
        )
        self.assertEqual(
            invocation["context"],
            BusinessContext("business-1"),
        )

    def test_workspace_cleanup_requires_service_authentication(
        self,
    ) -> None:
        response = self.client.request(
            "DELETE",
            "/agent/chats/chat-1/runtime",
            json={"businessId": "business-1"},
        )

        self.assertEqual(response.status_code, 401)

    def test_runtime_cleanup_returns_ok(
        self,
    ) -> None:
        deleted = self.client.request(
            "DELETE",
            "/agent/chats/chat-1/runtime",
            json={"businessId": "business-1"},
            headers=self.headers,
        )

        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(deleted.json(), {"status": "ok"})

    def test_chat_requires_latest_message_to_be_user_text(self) -> None:
        response = self.client.post(
            "/agent/chat",
            json={
                **REQUEST,
                "messages": [
                    {"role": "assistant", "content": "Not a user turn"}
                ],
            },
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 422)

    def test_chat_rejects_blog_mode_and_other_legacy_fields(self) -> None:
        response = self.client.post(
            "/agent/chat",
            json={**REQUEST, "mode": "blog"},
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 422)

    def test_production_requires_an_internal_service_token(self) -> None:
        with patch.dict(os.environ, {"ENVIRONMENT": "production"}):
            application = create_app(graph=FakeGraph(), internal_token="")
            with self.assertRaisesRegex(
                RuntimeError,
                "AGENT_INTERNAL_TOKEN is required",
            ):
                with TestClient(application):
                    pass

    def test_stream_emits_tool_activity_delta_and_done(self) -> None:
        response = self.client.post(
            "/agent/chats/chat-1/messages/stream",
            json=STREAM_REQUEST,
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["content-type"],
            "text/event-stream; charset=utf-8",
        )
        body = response.text
        self.assertIn(
            'event: reasoning\ndata: {"text":"Reasoning "}',
            body,
        )
        self.assertIn(
            'event: reasoning\ndata: {"text":"phase 1."}',
            body,
        )
        self.assertIn("event: action\n", body)
        self.assertIn('"tool":"web_search"', body)
        self.assertIn("event: action_result\n", body)
        self.assertIn('"count":1', body)
        self.assertIn('event: delta\ndata: {"text":"The answer."}', body)
        self.assertIn(
            'event: done\ndata: {"response":"The answer.",'
            '"actions":["Searched the web"]}',
            body,
        )
        self.assertLess(
            body.index("event: reasoning\n"),
            body.index("event: action\n"),
        )
        self.assertEqual(len(self.summarizer.calls), 1)
        self.assertEqual(
            self.summarizer.calls[0]["tool_calls"][0]["name"],
            "web_search",
        )
        self.assertEqual(
            self.summarizer.calls[0]["previous_reasoning"],
            [],
        )
        self.assertEqual(
            self.summarizer.calls[0]["recent_tool_results"],
            [],
        )

    def test_later_reasoning_gets_recent_safe_tool_result_metadata(self) -> None:
        summarizer = FakeReasoningSummarizer()
        client = TestClient(
            create_app(
                graph=TwoPhaseGraph(),
                internal_token="service-secret",
                reasoning_summarizer=summarizer,
            )
        )
        self.addCleanup(client.close)

        response = client.post(
            "/agent/chats/chat-1/messages/stream",
            json=STREAM_REQUEST,
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(summarizer.calls), 2)
        self.assertEqual(
            summarizer.calls[1]["previous_reasoning"],
            ["Reasoning phase 1."],
        )
        self.assertEqual(
            summarizer.calls[1]["recent_tool_results"][0],
            {
                "tool": "query_knowledge_base",
                "count": 1,
                "error": False,
                "results": [
                    {
                        "title": "The Six GEO Primitives",
                        "source": "GEO.docx",
                        "url": None,
                    }
                ],
            },
        )

    def test_stream_hides_low_value_workspace_tools(self) -> None:
        summarizer = FakeReasoningSummarizer()
        client = TestClient(
            create_app(
                graph=WorkspaceToolsGraph(),
                internal_token="service-secret",
                reasoning_summarizer=summarizer,
            )
        )
        self.addCleanup(client.close)

        response = client.post(
            "/agent/chats/chat-1/messages/stream",
            json=STREAM_REQUEST,
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        body = response.text
        self.assertNotIn('"tool":"ls"', body)
        self.assertNotIn('"tool":"glob"', body)
        self.assertNotIn('"label":"Used a tool"', body)
        self.assertIn('"label":"Read project file"', body)
        self.assertIn('"tool":"read_file"', body)
        self.assertEqual(len(summarizer.calls), 1)
        self.assertEqual(
            [call["name"] for call in summarizer.calls[0]["tool_calls"]],
            ["read_file"],
        )

if __name__ == "__main__":
    unittest.main()
