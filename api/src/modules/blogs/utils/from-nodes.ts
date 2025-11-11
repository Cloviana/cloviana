import { Node } from "@prisma/client";

export function fromNodes(nodes: Node[]): string {
  const map = nodes.reduce<Record<string, Node[]>>((acc, node) => {
    const key = node.parentKey ?? "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(node);
    return acc;
  }, {});
  return renderSection("root", map);
}

function renderSection(parentKey: string, map: Record<string, Node[]>): string {
  const children = map[parentKey] ?? [];
  children.sort((a, b) => a.sortOrder - b.sortOrder);

  let html = "";

  for (const node of children) {
    switch (node.type) {
      case "TEXT": {
        html += renderText(node);
        break;
      }
      case "PARAGRAPH": {
        html += `<p>${renderSection(node.key, map)}</p>`;
        break;
      }
      case "HEADING": {
        const tag = (node.payload as any)["tag"] as "h2" | "h3";
        html += `<${tag}>${renderSection(node.key, map)}</${tag}>`;
        break;
      }
      case "LIST": {
        const lt = (node.payload as any)["listType"] as
          | "bullet"
          | "number"
          | undefined;
        const tag = lt === "number" ? "ol" : "ul";
        html += `<${tag}>${renderSection(node.key, map)}</${tag}>`;
        break;
      }
      case "LIST_ITEM": {
        html += `<li>${renderSection(node.key, map)}</li>`;
        break;
      }
      case "LINK": {
        const url = (node.payload as any)["url"] ?? "#";
        html += `<a href="${url}" target="_blank" rel="noopener noreferrer">${renderSection(node.key, map)}</a>`;
        break;
      }
      case "QUOTE": {
        html += `<blockquote>${renderSection(node.key, map)}</blockquote>`;
        break;
      }
      case "LINEBREAK": {
        html += `<br/>`;
        break;
      }
      default: {
        break;
      }
    }
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const F = {
  BOLD: 1,
  ITALIC: 2,
  STRIKETHROUGH: 4,
  UNDERLINE: 8,
  CODE: 16,
  SUBSCRIPT: 32,
  SUPERSCRIPT: 64,
} as const;

function has(fmt: number, bit: number) {
  return (fmt & bit) === bit;
}

function renderText(node: Node): string {
  if (!node.payload) return "";
  const payload = node.payload as any;
  let content = escapeHtml(payload["text"] ?? "");
  const fmt = Number(payload["format"] ?? 0);

  if (has(fmt, F.CODE)) content = `<code>${content}</code>`;
  if (has(fmt, F.BOLD)) content = `<strong>${content}</strong>`;
  if (has(fmt, F.ITALIC)) content = `<em>${content}</em>`;
  if (has(fmt, F.UNDERLINE)) content = `<u>${content}</u>`;
  if (has(fmt, F.STRIKETHROUGH)) content = `<del>${content}</del>`;
  if (has(fmt, F.SUBSCRIPT)) content = `<sub>${content}</sub>`;
  if (has(fmt, F.SUPERSCRIPT)) content = `<sup>${content}</sup>`;

  return content;
}
