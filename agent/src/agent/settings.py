"""Process-level configuration for the Cloviana agent graph."""

from __future__ import annotations

from functools import lru_cache
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentSettings(BaseSettings):
    """Configuration shared by all runs in this process.

    Provider credentials remain in environment variables so model integrations
    can read them without copying secrets into graph state.
    """

    model_config = SettingsConfigDict(env_prefix="", extra="ignore", frozen=True)

    debug: bool = Field(default=False, validation_alias="CLOVIANA_AGENT_DEBUG")
    deepseek_api_key: SecretStr = Field(validation_alias="DEEPSEEK_API_KEY")
    groq_api_key: SecretStr = Field(validation_alias="GROQ_API_KEY")
    exa_api_key: SecretStr = Field(validation_alias="EXA_API_KEY")
    knowledge_base_url: str = Field(validation_alias="KNOWLEDGE_BASE_URL")
    cloviana_api_url: str = Field(validation_alias="CLOVIANA_API_URL")
    agent_internal_token: SecretStr = Field(validation_alias="AGENT_INTERNAL_TOKEN")
    database_url: SecretStr = Field(validation_alias="CLOVIANA_AGENT_DATABASE_URL")
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")

    @classmethod
    def from_env(cls) -> AgentSettings:
        return cls()

    @field_validator(
        "deepseek_api_key",
        "exa_api_key",
        "agent_internal_token",
        "database_url",
        mode="before",
    )
    @classmethod
    def _normalize_secret_value(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("knowledge_base_url", "cloviana_api_url")
    @classmethod
    def _validate_http_url(cls, value: str) -> str:
        normalized = value.strip().rstrip("/")
        parsed = urlsplit(normalized)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL settings must be valid HTTP or HTTPS URLs")
        return normalized

    @field_validator("environment")
    @classmethod
    def _strip_required_string(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("String settings must not be blank")
        return stripped


@lru_cache(maxsize=1)
def get_settings() -> AgentSettings:
    return AgentSettings.from_env()
