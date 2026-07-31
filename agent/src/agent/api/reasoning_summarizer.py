"""Groq-backed thinking/status summaries for chat tool phases."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from agent.api.schemas import ChatRequest
from agent.api.stream_accumulator import _tool_detail
from agent.settings import get_settings


# Groq for the thinking panel: the summaries are latency-critical filler,
# so the smallest fastest host wins over the main-model provider.
_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_REASONING_MODEL = "openai/gpt-oss-20b"


class ModelReasoningSummarizer:
    """Narrate tool-use phase transitions without exposing chain-of-thought."""

    def __init__(self, *, client: Any, model: str) -> None:
        self._client = client
        self._model = model

    @classmethod
    def from_settings(cls) -> ModelReasoningSummarizer:
        from openai import AsyncOpenAI

        return cls(
            client=AsyncOpenAI(
                api_key=get_settings().groq_api_key.get_secret_value(),
                base_url=_GROQ_BASE_URL,
                timeout=10.0,
                max_retries=1,
            ),
            model=_REASONING_MODEL,
        )

    async def astream(
        self,
        *,
        chat_request: ChatRequest,
        tool_calls: list[dict[str, Any]],
        previous_reasoning: list[str],
        recent_tool_results: list[dict[str, Any]],
    ) -> AsyncIterator[str]:
        payload = {
            "latest_user_message": chat_request.messages[-1].text,
            "previous_visible_reasoning": previous_reasoning[-3:],
            "recent_tool_results": recent_tool_results[-6:],
            "next_tool_phase": [
                {
                    "tool": str(tool_call.get("name") or "tool"),
                    "detail": _tool_detail(tool_call),
                }
                for tool_call in tool_calls
            ],
        }
        response = await self._client.chat.completions.create(
            model=self._model,
            temperature=0,
            stream=True,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Write user-visible thinking panel update"
                        "for the assistant's current tool phase. Make it "
                        "specific to the user's latest message and the next "
                        "tool phase. Do not mirror generic visible intent "
                        "phrases such as 'Let me check'. Do not expose raw "
                        "chain-of-thought, hidden assumptions, credentials, "
                        "private identifiers, stack traces, tool errors, JSON, "
                        "or implementation details."
                        "No formatting"
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(payload, ensure_ascii=False),
                },
            ],
            tools=[],
            tool_choice="none",
        )
        async for chunk in response:
            choice = chunk.choices[0] if chunk.choices else None
            content = choice.delta.content if choice else None
            if isinstance(content, str) and content:
                yield content
