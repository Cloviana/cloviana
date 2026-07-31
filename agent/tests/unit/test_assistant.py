"""Unit tests for production assistant construction."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from deepagents.backends import CompositeBackend, StateBackend
from pydantic import SecretStr

from agent.backends.memory import MEMORY_PATH
from agent.agents.assistant import (
    MAIN_AGENT_MODEL,
    SKILLS_PATH,
    _build_backend_factory,
    _build_main_model,
)
from agent.context import BusinessContext


class MainModelTest(unittest.TestCase):
    def test_builds_streaming_qwen_without_thinking(self) -> None:
        with patch(
            "agent.agents.assistant.get_settings",
            return_value=SimpleNamespace(groq_api_key=SecretStr("test-key")),
        ):
            model = _build_main_model()

        self.assertEqual(model.model_name, MAIN_AGENT_MODEL)
        self.assertEqual(MAIN_AGENT_MODEL, "qwen/qwen3.6-27b")
        self.assertIs(model.streaming, True)
        self.assertEqual(model.extra_body, {"reasoning_effort": "none"})

    def test_backend_factory_uses_thread_state_for_scratch_files(
        self,
    ) -> None:
        skills_backend = StateBackend()
        runtime = SimpleNamespace(
            context=BusinessContext("business-1"),
        )
        backend = _build_backend_factory(skills_backend)(runtime)

        self.assertIsInstance(backend, CompositeBackend)
        self.assertIsInstance(backend.default, StateBackend)
        self.assertIs(backend.routes[SKILLS_PATH], skills_backend)
        self.assertIn(MEMORY_PATH, backend.routes)


if __name__ == "__main__":
    unittest.main()
