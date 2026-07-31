"""Document parsing adapters.

Plain-text formats stay local. Binary document formats are sent to Unstructured
so document parsing does not load OCR/layout models into this service.
"""

from __future__ import annotations

import json
import logging
import mimetypes
import time
from pathlib import Path
from typing import Any

import backoff
import httpx

from knowledge_base.settings import KnowledgeBaseSettings, get_settings


logger = logging.getLogger(__name__)

_LOCAL_EXTENSIONS = {".txt", ".md", ".markdown"}
_UNSTRUCTURED_EXTENSIONS = {".pdf", ".docx"}
_HEADING_TYPES = {"Title", "Header"}
_LIST_TYPES = {"ListItem"}
_MAX_TRIES = 3
_TERMINAL_FAILURE_STATUSES = {"FAILED", "STOPPED"}


class UnstructuredParseError(RuntimeError):
    """Unstructured could not turn a supported document into text."""


def _require_content(content: bytes) -> None:
    if not content:
        raise ValueError("File is empty.")


def _decode_utf8(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        pass
    try:
        return content.decode("utf-16")
    except UnicodeDecodeError:
        return content.decode("latin-1")


def _require_text(text: str) -> str:
    text = text.strip()
    if not text:
        raise ValueError("No readable text found in file.")
    return text


def _elements_to_markdown(elements: Any) -> str:
    if not isinstance(elements, list):
        raise UnstructuredParseError("Unstructured returned an invalid response.")

    blocks: list[str] = []
    for element in elements:
        if not isinstance(element, dict):
            continue
        text = str(element.get("text") or "").strip()
        if not text:
            continue

        element_type = str(element.get("type") or "")
        metadata = element.get("metadata")
        metadata = metadata if isinstance(metadata, dict) else {}
        if element_type in _HEADING_TYPES:
            depth = metadata.get("category_depth", 0)
            depth = depth if isinstance(depth, int) else 0
            blocks.append(f"{'#' * min(max(depth + 1, 1), 6)} {text}")
        elif element_type in _LIST_TYPES:
            blocks.append(f"- {text}")
        else:
            blocks.append(text)

    return _require_text("\n\n".join(blocks))


class DocumentParser:
    def __init__(
        self,
        *,
        api_key: str,
        api_url: str,
        timeout_seconds: float,
        poll_interval_seconds: float,
    ) -> None:
        self._api_key = api_key
        self._api_url = api_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._poll_interval_seconds = poll_interval_seconds
        self._client: httpx.Client | None = None

    @classmethod
    def from_settings(
        cls,
        settings: KnowledgeBaseSettings | None = None,
    ) -> DocumentParser:
        settings = settings or get_settings()
        return cls(
            api_key=settings.unstructured_api_key or "",
            api_url=settings.unstructured_api_url,
            timeout_seconds=settings.unstructured_timeout_seconds,
            poll_interval_seconds=settings.unstructured_poll_interval_seconds,
        )

    def _load(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=self._timeout_seconds)
        return self._client

    def close(self) -> None:
        if self._client is not None:
            self._client.close()

    @staticmethod
    def _is_permanent_error(error: Exception) -> bool:
        if not isinstance(error, httpx.HTTPStatusError):
            return False
        status = error.response.status_code
        return 400 <= status < 500 and status != 429

    def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> httpx.Response:
        response = self._load().request(
            method,
            f"{self._api_url}/{path.lstrip('/')}",
            headers={
                "accept": "application/json",
                "unstructured-api-key": self._api_key,
            },
            **kwargs,
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError:
            logger.error(
                "Unstructured Transform request failed: method=%s path=%s "
                "status=%d body=%s",
                method,
                path,
                response.status_code,
                response.text[:1_000],
            )
            raise
        return response

    @backoff.on_exception(
        backoff.expo,
        httpx.HTTPError,
        max_tries=_MAX_TRIES,
        giveup=_is_permanent_error,
    )
    def _read_job(self, job_id: str) -> dict[str, Any]:
        payload = self._request("GET", f"jobs/{job_id}").json()
        if not isinstance(payload, dict):
            raise UnstructuredParseError(
                "Unstructured Transform returned invalid job details."
            )
        return payload

    @backoff.on_exception(
        backoff.expo,
        httpx.HTTPError,
        max_tries=_MAX_TRIES,
        giveup=_is_permanent_error,
    )
    def _download_output(self, job_id: str, file_id: str) -> Any:
        return self._request(
            "GET",
            f"jobs/{job_id}/download",
            params={"file_id": file_id},
        ).json()

    def _create_job(self, filename: str, content: bytes) -> str:
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        request_data = json.dumps(
            {
                "job_nodes": [
                    {
                        "name": "Partitioner",
                        "type": "partition",
                        "subtype": "vlm",
                        "settings": {
                            "is_dynamic": True,
                            "allow_fast": True,
                        },
                    }
                ]
            }
        )
        payload = self._request(
            "POST",
            "jobs/",
            files={"input_files": (filename, content, content_type)},
            data={"request_data": request_data},
        ).json()
        job_id = payload.get("id") if isinstance(payload, dict) else None
        if not isinstance(job_id, str) or not job_id:
            raise UnstructuredParseError(
                "Unstructured Transform did not return a job ID."
            )
        return job_id

    def _wait_for_job(self, job_id: str, filename: str) -> dict[str, Any]:
        deadline = time.monotonic() + self._timeout_seconds
        while True:
            job = self._read_job(job_id)
            status = str(job.get("status") or "").upper()
            if status == "COMPLETED":
                return job
            if status in _TERMINAL_FAILURE_STATUSES:
                raise UnstructuredParseError(
                    f"Unstructured Transform could not process {filename}: {status.lower()}."
                )

            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise UnstructuredParseError(
                    f"Unstructured Transform timed out while processing {filename}."
                )
            time.sleep(min(self._poll_interval_seconds, remaining))

    def _partition(self, filename: str, content: bytes) -> Any:
        job_id = self._create_job(filename, content)
        job = self._wait_for_job(job_id, filename)
        output_files = job.get("output_node_files")
        if not isinstance(output_files, list) or not output_files:
            raise UnstructuredParseError(
                "Unstructured Transform completed without a document output."
            )
        output = output_files[0]
        file_id = output.get("file_id") if isinstance(output, dict) else None
        if not isinstance(file_id, str) or not file_id:
            raise UnstructuredParseError(
                "Unstructured Transform returned invalid output metadata."
            )
        return self._download_output(job_id, file_id)

    def parse_file(self, filename: str, content: bytes) -> str:
        _require_content(content)
        extension = Path(filename).suffix.lower()

        if extension in _LOCAL_EXTENSIONS:
            return _require_text(_decode_utf8(content))

        if extension not in _UNSTRUCTURED_EXTENSIONS:
            raise ValueError(
                "Unsupported file type. Only PDF, DOCX, Markdown, and TXT are allowed."
            )
        if not self._api_key:
            raise UnstructuredParseError("UNSTRUCTURED_API_KEY is not configured.")

        try:
            elements = self._partition(filename, content)
            return _elements_to_markdown(elements)
        except UnstructuredParseError:
            raise
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {401, 403}:
                raise UnstructuredParseError(
                    "Unstructured Transform authentication failed."
                ) from exc
            raise UnstructuredParseError(
                f"Unstructured Transform rejected {filename} with status "
                f"{exc.response.status_code}."
            ) from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise UnstructuredParseError(
                f"Unstructured Transform could not process {filename}."
            ) from exc
