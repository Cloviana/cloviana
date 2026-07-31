"""Request/response schemas for the private ask-only chat service."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any, Literal, Protocol

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


_MAX_MESSAGES = 200
_MAX_MESSAGE_CHARS = 50_000
# Groq caps requests at 20MB and 3 images; stay under with margin for the
# rest of the prompt. 8M base64 chars ≈ 6MB of image bytes.
_MAX_IMAGES_PER_MESSAGE = 3
_MAX_IMAGE_DATA_CHARS = 8_000_000
_IMAGE_DATA_URI = r"^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$"


def _camel_case(name: str) -> str:
    head, *rest = name.split("_")
    return "".join([head, *(part.capitalize() for part in rest)])


def _require_nonblank(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("identifier must not be blank")
    return value


def _require_latest_user_message(messages: list[ChatMessage]) -> None:
    if messages[-1].role != "user":
        raise ValueError("the latest message must be from the user")


class _InternalModel(BaseModel):
    """Base for request bodies sent by the authenticated NestJS API:
    camelCase-on-the-wire, snake_case in Python."""

    model_config = ConfigDict(
        alias_generator=_camel_case,
        populate_by_name=True,
        extra="forbid",
    )


class AgentGraph(Protocol):
    """The small compiled-graph surface used by the HTTP adapter."""

    async def ainvoke(self, *args: Any, **kwargs: Any) -> dict[str, Any]: ...

    def astream(self, *args: Any, **kwargs: Any) -> AsyncIterator[Any]: ...


class ReasoningSummarizer(Protocol):
    """Produces user-visible thinking/status summaries for tool-use phases."""

    def astream(
        self,
        *,
        chat_request: ChatRequest,
        tool_calls: list[dict[str, Any]],
        previous_reasoning: list[str],
        recent_tool_results: list[dict[str, Any]],
    ) -> AsyncIterator[str]: ...


class TextPart(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["text"]
    text: str = Field(min_length=1, max_length=_MAX_MESSAGE_CHARS)


class ImageURL(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(
        pattern=_IMAGE_DATA_URI, max_length=_MAX_IMAGE_DATA_CHARS
    )


class ImagePart(BaseModel):
    """OpenAI-style image part; only inline data URIs are accepted so the
    agent never fetches attacker-controlled remote URLs."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["image_url"]
    image_url: ImageURL


class ChatMessage(BaseModel):
    """One trusted conversation message: plain text, or text plus images."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str | list[TextPart | ImagePart] = Field(
        min_length=1, max_length=_MAX_MESSAGE_CHARS
    )

    @property
    def text(self) -> str:
        if isinstance(self.content, str):
            return self.content
        return "\n".join(
            part.text for part in self.content if isinstance(part, TextPart)
        )

    @model_validator(mode="after")
    def validate_parts(self) -> ChatMessage:
        if isinstance(self.content, str):
            return self
        images = [p for p in self.content if isinstance(p, ImagePart)]
        if len(images) > _MAX_IMAGES_PER_MESSAGE:
            raise ValueError(
                f"at most {_MAX_IMAGES_PER_MESSAGE} images per message"
            )
        if images and self.role != "user":
            raise ValueError("only user messages may contain images")
        if not self.text.strip():
            raise ValueError("a message must contain text")
        return self


class ChatRequest(_InternalModel):
    """Internal request sent by the authenticated NestJS API."""

    business_id: str = Field(min_length=1, max_length=256)
    chat_id: str = Field(min_length=1, max_length=256)
    messages: list[ChatMessage] = Field(min_length=1, max_length=_MAX_MESSAGES)

    @field_validator("business_id", "chat_id")
    @classmethod
    def strip_identifiers(cls, value: str) -> str:
        return _require_nonblank(value)

    @model_validator(mode="after")
    def require_latest_user_message(self) -> ChatRequest:
        _require_latest_user_message(self.messages)
        return self


class ChatRuntimeRequest(_InternalModel):
    """Internal lifecycle request for a chat runtime."""

    business_id: str = Field(min_length=1, max_length=256)

    @field_validator("business_id")
    @classmethod
    def strip_identifiers(cls, value: str) -> str:
        return _require_nonblank(value)


class ChatMessagesRequest(_InternalModel):
    """Internal stream request whose chat identity comes from the URL."""

    business_id: str = Field(min_length=1, max_length=256)
    messages: list[ChatMessage] = Field(min_length=1, max_length=_MAX_MESSAGES)

    @field_validator("business_id")
    @classmethod
    def strip_identifiers(cls, value: str) -> str:
        return _require_nonblank(value)

    @model_validator(mode="after")
    def require_latest_user_message(self) -> ChatMessagesRequest:
        _require_latest_user_message(self.messages)
        return self

    def to_chat_request(self, chat_id: str) -> ChatRequest:
        return ChatRequest(
            business_id=self.business_id,
            chat_id=chat_id,
            messages=self.messages,
        )


class ChatResponse(BaseModel):
    response: str
    actions: list[str] = Field(default_factory=list)


class WorkspaceResponse(BaseModel):
    status: Literal["ok"]
