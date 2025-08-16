import { Node } from "@prisma/client";

/**
 * Render a flat list of Nodes into nested HTML.
 */
export function fromNodes(nodes: Node[]): string {
  // Group nodes by parentKey (or "root" if none)
  const map = nodes.reduce<Record<string, Node[]>>((acc, node) => {
    const key = node.parentKey ?? "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(node);
    return acc;
  }, {});

  // Recursively render starting from the root
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
        const level = (node.payload as any)["level"] as 2 | 3;
        html += `<h${level}>${renderSection(node.key, map)}</h${level}>`;
        break;
      }
      case "LIST": {
        const style = (node.payload as any)["style"] as "ordered" | "unordered";
        const tag = style === "ordered" ? "ol" : "ul";
        html += `<${tag}>${renderSection(node.key, map)}</${tag}>`;
        break;
      }
      case "LIST_ITEM": {
        html += `<li>${renderSection(node.key, map)}</li>`;
        break;
      }
      default: {
        // Unknown or unhandled node types
        break;
      }
    }
  }

  return html;
}

/**
 * Simple HTML escaper to prevent injecting raw text as markup.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderText(node: Node): string {
  if (!node.payload) return "";

  let content = escapeHtml(node.payload["text"]);

  const {
    bold,
    italic,
    underline,
    strikethrough,
    code,
    subscript,
    superscript,
  } = node.payload["styles"] ?? {};

  if (code) content = `<code>${content}</code>`;
  if (bold) content = `<strong>${content}</strong>`;
  if (italic) content = `<em>${content}</em>`;
  if (underline) content = `<u>${content}</u>`;
  if (strikethrough) content = `<del>${content}</del>`;
  if (subscript) content = `<sub>${content}</sub>`;
  if (superscript) content = `<sup>${content}</sup>`;

  return content;
}
