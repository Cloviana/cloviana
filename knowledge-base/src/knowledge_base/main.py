"""ASGI entrypoint."""

from __future__ import annotations

import logging

from knowledge_base.api.app import create_app


logging.basicConfig(level=logging.INFO)

app = create_app()
