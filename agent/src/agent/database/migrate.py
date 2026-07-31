"""Prepare the persistent LangGraph store before the agent starts."""

from __future__ import annotations

import asyncio
import os

from langgraph.store.postgres import AsyncPostgresStore
from psycopg import AsyncConnection


async def migrate() -> None:
    database_url = os.environ["CLOVIANA_AGENT_DATABASE_URL"].strip()
    if not database_url:
        raise RuntimeError("CLOVIANA_AGENT_DATABASE_URL must not be empty")

    async with await AsyncConnection.connect(database_url) as connection:
        await connection.execute("CREATE SCHEMA IF NOT EXISTS langgraph")

    async with AsyncPostgresStore.from_conn_string(
        database_url,
        pool_config={
            "min_size": 1,
            "max_size": 1,
            "kwargs": {"prepare_threshold": None},
        },
    ) as store:
        await store.setup()


if __name__ == "__main__":
    asyncio.run(migrate())
