"""Shared schema primitives."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


BUSINESS_ID_PATTERN = r"^[A-Za-z0-9_-]+$"


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
