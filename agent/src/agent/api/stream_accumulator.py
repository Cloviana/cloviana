"""Translates a LangGraph astream() output into SSE-formatted strings."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    ToolMessage,
)

from agent.api.schemas import ChatRequest, ReasoningSummarizer

logger = logging.getLogger(__name__)

_TOOL_LABELS = {
    "query_knowledge_base": "Searched the knowledge base",
    "web_search": "Searched the web",
    "web_extract": "Read web pages",
    "read_file": "Read project file",
}
_VISIBLE_TOOLS = frozenset(
    {
        "query_knowledge_base",
        "web_search",
        "web_extract",
        "read_file",
    }
)


@dataclass(frozen=True)
class _ToolInfo:
    """Consolidates the visible/label lookup that used to be duplicated
    across the AIMessage and ToolMessage handling branches."""

    visible: bool
    label: str


def _tool_info(name: str) -> _ToolInfo:
    return _ToolInfo(
        visible=name in _VISIBLE_TOOLS,
        label=_TOOL_LABELS.get(name, "Used a tool"),
    )


def _message_text(message: BaseMessage) -> str:
    content = message.content
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""

    text: list[str] = []
    for block in content:
        if isinstance(block, str):
            text.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            value = block.get("text")
            if isinstance(value, str):
                text.append(value)
    return "".join(text)


_MAX_PAYLOAD_DEPTH = 20


def _iter_messages(value: Any, depth: int = 0) -> Iterator[BaseMessage]:
    """Recursively walks a LangGraph 'updates' payload (arbitrarily nested
    dicts/lists/tuples of node-name -> state-update) yielding every
    BaseMessage found. Payloads are shallow in practice; the depth cap only
    guards against a pathological payload blowing the stack."""
    if depth > _MAX_PAYLOAD_DEPTH:
        return
    if isinstance(value, BaseMessage):
        yield value
    elif isinstance(value, dict):
        for nested in value.values():
            yield from _iter_messages(nested, depth + 1)
    elif isinstance(value, (list, tuple)):
        for nested in value:
            yield from _iter_messages(nested, depth + 1)


def _tool_detail(tool_call: dict[str, Any]) -> str | None:
    args = tool_call.get("args")
    if not isinstance(args, dict):
        return None
    if tool_call.get("name") == "read_file":
        return None
    query = args.get("query")
    if isinstance(query, str):
        return query[:500]
    urls = args.get("urls")
    if isinstance(urls, list):
        return f"{len(urls)} page{'s' if len(urls) != 1 else ''}"
    return None


def _tool_result_payload(message: ToolMessage) -> dict[str, Any]:
    """Full tool result, as sent to the client over SSE."""
    artifact = message.artifact if isinstance(message.artifact, dict) else {}
    results = artifact.get("results")
    safe_results = results if isinstance(results, list) else []
    return {
        "id": message.tool_call_id,
        "count": len(safe_results),
        "results": safe_results,
        "error": message.status == "error" or bool(artifact.get("error")),
    }


def _tool_result_digest(message: ToolMessage) -> dict[str, Any]:
    payload = _tool_result_payload(message)
    return {
        "tool": str(message.name or "tool"),
        "count": payload["count"],
        "error": payload["error"],
        "results": [
            {
                "title": item.get("title"),
                "source": item.get("source"),
                "url": item.get("url"),
            }
            for item in payload["results"][:5]
            if isinstance(item, dict)
        ],
    }


def _sse(event: str, data: dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return f"event: {event}\ndata: {payload}\n\n"


class _StreamAccumulator:
    """Owns all mutable state needed to turn a graph's astream() output
    into a sequence of SSE-formatted strings.

    This used to be a pile of ~9 locals plus a nested closure inside
    `_chat_events`. Pulling it out into its own class makes each piece of
    the translation (AI message deltas, tool-call announcements, tool
    results, and thinking/status summaries) independently testable and easier to
    reason about in isolation.

    Tool-call narration is visible assistant text, not reasoning. The thinking
    panel gets separate action events from tool calls instead of duplicated
    model text.
    """

    def __init__(
        self,
        chat_request: ChatRequest,
        reasoning_summarizer: ReasoningSummarizer | None,
    ) -> None:
        self._chat_request = chat_request
        self._reasoning_summarizer = reasoning_summarizer
        self._streamed_text = ""
        self._final_text = ""
        self._actions: list[str] = []
        self._seen_actions: set[str] = set()
        self._seen_results: set[str] = set()
        self._hidden_tool_calls: set[str] = set()
        self._reasoning_history: list[str] = []
        self._recent_tool_results: list[dict[str, Any]] = []

    async def process(self, part: dict[str, Any]) -> AsyncIterator[str]:
        """Translate one item from graph.astream() into zero or more SSE
        strings."""
        part_type = part.get("type")
        data = part.get("data")

        if part_type == "messages":
            for event in self._handle_message_chunk(data):
                yield event
            return

        if part_type != "updates":
            return

        for message in _iter_messages(data):
            if isinstance(message, AIMessage):
                async for event in self._handle_ai_message(message):
                    yield event
            elif isinstance(message, ToolMessage):
                async for event in self._handle_tool_message(message):
                    yield event

    def _handle_message_chunk(self, data: Any) -> list[str]:
        if not (isinstance(data, tuple) and data):
            return []
        message = data[0]
        if not isinstance(message, AIMessageChunk):
            return []
        text = _message_text(message)
        events: list[str] = []

        if not text:
            return events

        self._streamed_text += text
        events.append(_sse("delta", {"text": text}))
        return events

    async def _handle_ai_message(
        self, message: AIMessage
    ) -> AsyncIterator[str]:
        text = _message_text(message).strip()
        if text and not message.tool_calls:
            self._final_text = text

        tool_calls = [
            tool_call
            for tool_call in message.tool_calls
            if isinstance(tool_call, dict)
        ]

        for tool_call in tool_calls:
            call_id = str(tool_call.get("id") or "")
            tool_name = str(tool_call.get("name") or "tool")
            if call_id and not _tool_info(tool_name).visible:
                self._hidden_tool_calls.add(call_id)

        action_calls = [
            tool_call
            for tool_call in tool_calls
            if _tool_info(str(tool_call.get("name") or "tool")).visible
        ]
        new_action_calls = [
            tool_call
            for tool_call in action_calls
            if str(tool_call.get("id") or "")
            and str(tool_call.get("id") or "") not in self._seen_actions
        ]

        if new_action_calls:
            async for event in self._stream_reasoning(new_action_calls):
                yield event

        for tool_call in new_action_calls:
            call_id = str(tool_call.get("id") or "")
            tool_name = str(tool_call.get("name") or "tool")
            self._seen_actions.add(call_id)
            info = _tool_info(tool_name)
            self._actions.append(info.label)
            yield _sse(
                "action",
                {
                    "id": call_id,
                    "label": info.label,
                    "tool": tool_name,
                    "detail": _tool_detail(tool_call),
                },
            )

    async def _handle_tool_message(
        self, message: ToolMessage
    ) -> AsyncIterator[str]:
        call_id = str(message.tool_call_id)
        tool_name = str(message.name or "tool")
        info = _tool_info(tool_name)

        if call_id in self._hidden_tool_calls or not info.visible:
            self._seen_results.add(call_id)
            return
        if call_id in self._seen_results:
            return

        if call_id not in self._seen_actions:
            self._seen_actions.add(call_id)
            self._actions.append(info.label)
            yield _sse(
                "action",
                {
                    "id": call_id,
                    "label": info.label,
                    "tool": tool_name,
                    "detail": None,
                },
            )

        self._seen_results.add(call_id)
        payload = _tool_result_payload(message)
        self._recent_tool_results.append(_tool_result_digest(message))
        yield _sse("action_result", payload)

    async def _stream_reasoning(
        self, tool_calls: list[dict[str, Any]]
    ) -> AsyncIterator[str]:
        if self._reasoning_summarizer is None or not tool_calls:
            return
        summary_chunks: list[str] = []
        try:
            async for text in self._reasoning_summarizer.astream(
                chat_request=self._chat_request,
                tool_calls=tool_calls,
                previous_reasoning=list(self._reasoning_history),
                recent_tool_results=list(self._recent_tool_results),
            ):
                summary_chunks.append(text)
                yield _sse("reasoning", {"text": text})
        except Exception:
            logger.exception(
                "Reasoning summary failed for business=%s chat=%s",
                self._chat_request.business_id,
                self._chat_request.chat_id,
            )
            return
        summary = "".join(summary_chunks).strip()
        if summary:
            self._reasoning_history.append(summary)

    def final_response(self) -> str:
        """Returns the assistant's final text, preferring the explicit
        non-tool-call AIMessage over the raw streamed deltas."""
        return self._final_text or self._streamed_text.strip()

    @property
    def actions(self) -> list[str]:
        return self._actions
