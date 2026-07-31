"""LangGraph deployment entry point for the Cloviana deep agent."""

from __future__ import annotations

from langgraph.store.base import BaseStore

from agent.agents.assistant import build_assistant
from agent.settings import AgentSettings


def build_graph(
    settings: AgentSettings | None = None,
    *,
    store: BaseStore | None = None,
):
    """Construct the graph without run-specific state.

    LangGraph supplies conversation identity through ``thread_id`` and trusted
    tenant identity through :class:`BusinessContext` at invocation time.
    """

    return build_assistant(settings, store=store)


graph = build_graph()
