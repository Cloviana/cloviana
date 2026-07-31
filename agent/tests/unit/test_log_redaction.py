"""Credentials must never reach a log handler in cleartext."""

from __future__ import annotations

import logging
import unittest

from agent.api import _RedactCredentials


class RedactCredentialsTest(unittest.TestCase):
    def _emit(self, msg: str, *args: object) -> str:
        record = logging.LogRecord(
            name="psycopg.pool",
            level=logging.WARNING,
            pathname=__file__,
            lineno=1,
            msg=msg,
            args=args or None,
            exc_info=None,
        )
        self.assertTrue(_RedactCredentials().filter(record))
        return record.getMessage()

    def test_redacts_password_in_postgres_url(self) -> None:
        message = self._emit(
            "error connecting in %r: %s",
            "pool-1",
            'invalid connection option "postgresql://postgres.abc:s3cr3t'
            '@aws-0.pooler.supabase.com:6543/postgres"',
        )
        self.assertNotIn("s3cr3t", message)
        self.assertIn("postgres.abc:***@aws-0.pooler.supabase.com", message)

    def test_redacts_keyword_conninfo_password(self) -> None:
        message = self._emit("connection failed: password=hunter2 host=db")
        self.assertNotIn("hunter2", message)
        self.assertIn("password=***", message)

    def test_leaves_ordinary_urls_alone(self) -> None:
        message = self._emit("calling http://host.docker.internal:5000/api")
        self.assertEqual(message, "calling http://host.docker.internal:5000/api")


if __name__ == "__main__":
    unittest.main()
