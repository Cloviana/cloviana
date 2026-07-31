"""Immutable, trusted business context supplied for each agent run."""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass


_MAX_ID_LENGTH = 256


def _validate_identifier(value: str, field_name: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError(f"{field_name} must not be empty")
    if len(value) > _MAX_ID_LENGTH:
        raise ValueError(
            f"{field_name} must be at most {_MAX_ID_LENGTH} characters"
        )
    if any(unicodedata.category(character) == "Cc" for character in value):
        raise ValueError(f"{field_name} must not contain control characters")
    return value


@dataclass(frozen=True, slots=True)
class BusinessContext:
    """Trusted tenant identity for one invocation.

    Derive ``business_id`` from authenticated server-side data. Never copy it
    directly from user-controlled request data.
    """

    business_id: str

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "business_id",
            _validate_identifier(self.business_id, "business_id"),
        )
