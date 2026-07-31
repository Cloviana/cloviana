"""Lightweight, section-aware Markdown chunking."""

from __future__ import annotations

from dataclasses import dataclass
import re

from knowledge_base.settings import KnowledgeBaseSettings, get_settings


_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")


@dataclass(frozen=True)
class Chunk:
    text: str
    section: str
    embedding_text: str


def _split_oversized(text: str, max_chars: int) -> list[str]:
    words = text.split()
    if not words:
        return []

    pieces: list[str] = []
    current: list[str] = []
    current_length = 0
    for word in words:
        added = len(word) + (1 if current else 0)
        if current and current_length + added > max_chars:
            pieces.append(" ".join(current))
            current = [word]
            current_length = len(word)
        else:
            current.append(word)
            current_length += added
    if current:
        pieces.append(" ".join(current))
    return pieces


def _pack_blocks(blocks: list[str], max_chars: int) -> list[str]:
    chunks: list[str] = []
    current: list[str] = []
    current_length = 0

    for block in blocks:
        pieces = (
            _split_oversized(block, max_chars)
            if len(block) > max_chars
            else [block]
        )
        for piece in pieces:
            added = len(piece) + (2 if current else 0)
            if current and current_length + added > max_chars:
                chunks.append("\n\n".join(current))
                current = [piece]
                current_length = len(piece)
            else:
                current.append(piece)
                current_length += added

    if current:
        chunks.append("\n\n".join(current))
    return chunks


def chunk_markdown(
    markdown: str,
    title: str,
    settings: KnowledgeBaseSettings | None = None,
) -> list[Chunk]:
    markdown = markdown.strip()
    if not markdown:
        return []

    settings = settings or get_settings()
    sections: list[tuple[str, list[str]]] = []
    heading_path: list[str] = []
    current_section = title
    current_lines: list[str] = []

    def flush_section() -> None:
        nonlocal current_lines
        body = "\n".join(current_lines).strip()
        if body:
            blocks = [block.strip() for block in re.split(r"\n\s*\n", body) if block.strip()]
            sections.append((current_section, blocks))
        current_lines = []

    for line in markdown.splitlines():
        match = _HEADING_RE.match(line)
        if not match:
            current_lines.append(line)
            continue

        flush_section()
        depth = len(match.group(1))
        heading = match.group(2).strip()
        heading_path[depth - 1 :] = [heading]
        current_section = " > ".join(heading_path) or title

    flush_section()

    chunks: list[Chunk] = []
    for section, blocks in sections:
        for text in _pack_blocks(blocks, settings.chunk_size_chars):
            context = f"Title: {title}\nSection: {section}"
            chunks.append(
                Chunk(
                    text=text,
                    section=section,
                    embedding_text=f"{context}\n\n{text}",
                )
            )
    return chunks
