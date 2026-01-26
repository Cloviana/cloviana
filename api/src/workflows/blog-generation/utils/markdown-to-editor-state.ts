import { EditorStateSchema } from "@/workflows/blog-generation/schemas/node.schemas";
import remarkParse from "remark-parse";
import { unified } from "unified";

type TextFormat = "bold" | "italic" | "underline";

type MdNode = any;

function mergeFormats(
  base: TextFormat[] | null,
  next: TextFormat,
): TextFormat[] {
  const arr = base ? [...base] : [];
  if (!arr.includes(next)) arr.push(next);
  return arr;
}

function convertInline(
  nodes: MdNode[],
  format: TextFormat[] | null = null,
): any[] {
  const result: any[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      result.push({
        type: "TEXT",
        text: node.value,
        format,
      });
    } else if (node.type === "strong") {
      result.push(
        ...convertInline(node.children || [], mergeFormats(format, "bold")),
      );
    } else if (node.type === "emphasis") {
      result.push(
        ...convertInline(node.children || [], mergeFormats(format, "italic")),
      );
    } else if (node.type === "link") {
      const textChildren = convertInline(node.children || [], null).filter(
        (c) => c.type === "TEXT",
      );
      if (textChildren.length > 0) {
        result.push({
          type: "LINK",
          url: node.url,
          children: textChildren,
        });
      }
    } else if (node.type === "image") {
      result.push({
        type: "IMAGE",
        src: node.url || "",
        altText: node.alt || "",
      });
    }
  }

  return result;
}

function extractTextFromMd(node: MdNode): string {
  if (!node) return "";
  if (node.type === "text") return node.value || "";
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromMd).join(" ");
  }
  return "";
}

function convertBlock(node: MdNode): any | null {
  if (node.type === "paragraph") {
    return {
      type: "PARAGRAPH",
      children: convertInline(node.children || []),
    };
  }

  if (node.type === "heading") {
    const tag = node.depth === 2 ? "h2" : node.depth === 3 ? "h3" : null;
    if (!tag) return null;
    return {
      type: "HEADING",
      tag,
      children: convertInline(node.children || []),
    };
  }

  if (node.type === "list") {
    const listType = node.ordered ? "number" : "bullet";

    const items = (node.children || []).map((item: MdNode) => {
      const inlineNodes: MdNode[] = [];

      for (const child of item.children || []) {
        if (child.type === "paragraph") {
          inlineNodes.push(...(child.children || []));
        } else {
          inlineNodes.push(child);
        }
      }

      const children = convertInline(inlineNodes);

      return {
        type: "LIST_ITEM",
        children,
      };
    });

    if (!items.length) return null;

    return {
      type: "LIST",
      listType,
      children: items,
    };
  }

  if (node.type === "image") {
    return {
      type: "IMAGE",
      src: node.url,
      altText: node.alt || "",
    };
  }

  return null;
}

export function markdownToEditorState(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown) as MdNode;
  const children: any[] = [];

  for (const child of tree.children || []) {
    const converted = convertBlock(child);
    if (converted) children.push(converted);
  }

  const root = {
    type: "ROOT",
    children,
  };

  return EditorStateSchema.parse({ root });
}
