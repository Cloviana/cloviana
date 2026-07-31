"""Construction of the production Cloviana assistant."""

from __future__ import annotations

import os
import warnings
from collections.abc import Callable
from importlib.resources import files
from pathlib import Path
from typing import Any

from deepagents import create_deep_agent
from deepagents.backends import CompositeBackend, StoreBackend
from deepagents.backends.utils import create_file_data
from langchain.tools import ToolRuntime
from langchain_core._api.deprecation import LangChainDeprecationWarning
from langchain_openai import ChatOpenAI
from langgraph.store.base import BaseStore
from langgraph.store.memory import InMemoryStore

# ponytail: our backend must be built per-request (business_id/chat_id vary
# per thread), so it can't be a static BackendProtocol instance yet. Silence
# the callable-factory deprecation until deepagents 0.7.0 forces a redesign.
warnings.filterwarnings(
    "ignore",
    message=r"Passing a callable \(factory\) as `backend`",
    category=LangChainDeprecationWarning,
)

from agent.backends.memory import build_memory_backend
from agent.context import BusinessContext
from agent.middleware.brand_context import BrandContextMiddleware
from agent.middleware.date_context import CurrentDateMiddleware
from agent.middleware.errors import SafeToolErrorMiddleware
from agent.middleware.permissions import (
    BusinessContextGuardMiddleware,
    build_filesystem_permissions,
)
from agent.middleware.rate_limits import build_rate_limit_middleware
from agent.settings import AgentSettings, get_settings
from agent.tools.knowledge import KNOWLEDGE_TOOLS
from agent.tools.web import WEB_TOOLS


SKILLS_PATH = "/skills/"
# Groq trial for the main chat model: ~0.3s TTFT and ~10x generation speed.
MAIN_AGENT_MODEL = "qwen/qwen3.6-27b"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_SKILLS_NAMESPACE = ("cloviana", "packaged-skills")
_PACKAGED_SKILLS = ("humanize-content",)


def _load_system_prompt() -> str | None:
    configured = os.getenv("CLOVIANA_SYSTEM_PROMPT_PATH", "").strip()
    if configured:
        prompt_path = Path(configured).expanduser()
        prompt = prompt_path.read_text(encoding="utf-8").strip()
    else:
        prompt = (
            files("agent")
            .joinpath("agents/prompts/system.md")
            .read_text(encoding="utf-8")
            .strip()
        )
    return prompt or None


def _skills_namespace(_runtime: Any) -> tuple[str, ...]:
    return _SKILLS_NAMESPACE


def _build_skills_backend() -> StoreBackend:
    """Seed the selected immutable skills into an isolated runtime store."""

    store = InMemoryStore()
    skills_root = files("agent").joinpath("skills")
    for skill_name in _PACKAGED_SKILLS:
        content = (
            skills_root.joinpath(skill_name)
            .joinpath("SKILL.md")
            .read_text(encoding="utf-8")
        )
        store.put(
            namespace=_SKILLS_NAMESPACE,
            key=f"/{skill_name}/SKILL.md",
            value=create_file_data(content),
        )
    return StoreBackend(store=store, namespace=_skills_namespace)


def _build_backend(
    _runtime: ToolRuntime[Any, BusinessContext],
    *,
    skills_backend: StoreBackend,
) -> CompositeBackend:
    """Build the per-run filesystem backend.

    Unmatched paths live in thread-scoped graph state. Persistent business
    memory and packaged skills stay on explicit virtual routes.
    """

    return build_memory_backend(
        routes={SKILLS_PATH: skills_backend},
    )


def _build_backend_factory(
    skills_backend: StoreBackend,
) -> Callable[[ToolRuntime[Any, BusinessContext]], CompositeBackend]:
    def backend_for_runtime(
        runtime: ToolRuntime[Any, BusinessContext],
    ) -> CompositeBackend:
        return _build_backend(runtime, skills_backend=skills_backend)

    return backend_for_runtime


def _build_main_model() -> ChatOpenAI:
    return ChatOpenAI(
        model=MAIN_AGENT_MODEL,
        api_key=get_settings().groq_api_key,
        base_url=GROQ_BASE_URL,
        temperature=0.2,
        streaming=True,
        timeout=30.0,
        max_retries=1,
        # qwen3.6 dual-mode: thinking OFF for speed, per product decision.
        # Known trade: non-thinking mode sometimes skips the mandated KB
        # search and ignores the no-dash rule.
        extra_body={"reasoning_effort": "none"},
    )


def build_assistant(
    settings: AgentSettings | None = None,
    *,
    store: BaseStore | None = None,
):
    """Build the configured Deep Agent graph.

    Selected packaged skills are copied into an isolated in-memory store at
    startup. Built-in filesystem permissions make that route read-only.
    """

    resolved_settings = settings or AgentSettings.from_env()
    backend = _build_backend_factory(_build_skills_backend())

    return create_deep_agent(
        model=_build_main_model(),
        tools=[*KNOWLEDGE_TOOLS, *WEB_TOOLS],
        system_prompt=_load_system_prompt(),
        context_schema=BusinessContext,
        backend=backend,
        store=store,
        skills=[SKILLS_PATH],
        middleware=[
            BusinessContextGuardMiddleware(),
            CurrentDateMiddleware(),
            BrandContextMiddleware(),
            *build_rate_limit_middleware(),
            SafeToolErrorMiddleware(),
        ],
        permissions=build_filesystem_permissions(),
        debug=resolved_settings.debug,
        name="cloviana",
    )
