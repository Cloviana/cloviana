from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class OkfDocument:
    metadata: dict[str, Any]
    body: str

    @property
    def title(self) -> str:
        return str(self.metadata["title"])

    def as_markdown(self) -> str:
        frontmatter = yaml.safe_dump(
            self.metadata,
            sort_keys=False,
            allow_unicode=True,
        ).strip()
        return f"---\n{frontmatter}\n---\n\n{self.body}"

    def qdrant_metadata(self) -> dict[str, Any]:
        timestamp = self.metadata.get("timestamp")
        if hasattr(timestamp, "isoformat"):
            timestamp = timestamp.isoformat()
        payload = {
            "okfType": str(self.metadata.get("type") or ""),
            "title": str(self.metadata.get("title") or ""),
            "description": str(self.metadata.get("description") or ""),
            "resource": str(self.metadata.get("resource") or ""),
            "timestamp": timestamp,
        }
        return {key: value for key, value in payload.items() if value not in (None, "", [])}


def _split_frontmatter(markdown: str) -> tuple[dict[str, Any], str]:
    # Line-based split instead of a DOTALL regex: a large file that opens
    # with --- but never closes it costs one linear scan, not a regex crawl.
    first_line, newline, rest = markdown.partition("\n")
    if first_line.strip() != "---" or not newline:
        return {}, markdown.strip()

    lines = rest.splitlines()
    for index, line in enumerate(lines):
        if line.strip() != "---":
            continue
        try:
            metadata = yaml.safe_load("\n".join(lines[:index])) or {}
        except yaml.YAMLError as exc:
            raise ValueError("Markdown contains invalid YAML frontmatter.") from exc
        if not isinstance(metadata, dict):
            raise ValueError("Markdown YAML frontmatter must be an object.")
        return metadata, "\n".join(lines[index + 1 :]).strip()

    return {}, markdown.strip()


def normalize_to_okf(
    filename: str,
    markdown: str,
    document_id: str,
    business_id: str,
    folder_id: str,
    folder_name: str,
) -> OkfDocument:
    metadata, body = _split_frontmatter(markdown)
    title = str(metadata.get("title") or Path(filename).stem.replace("_", " ").strip() or "Document")

    metadata["type"] = str(metadata.get("type") or "Source Document")
    metadata["title"] = title
    metadata["documentId"] = document_id
    metadata["businessId"] = business_id
    metadata["folderId"] = folder_id
    metadata["folderName"] = folder_name
    metadata["sourceFilename"] = filename

    return OkfDocument(metadata=metadata, body=body)
