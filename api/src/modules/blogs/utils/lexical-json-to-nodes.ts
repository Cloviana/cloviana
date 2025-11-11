import { NodeType, Prisma } from "@prisma/client";

export type NodeInput = Omit<
  Prisma.NodeCreateManyInput,
  "blogId" | "createdAt" | "updatedAt"
>;

type Lx = {
  root?: {
    children?: any[];
  };
};

function asKey(v: unknown) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

function textFrom(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  const children = Array.isArray(node.children) ? node.children : [];
  return children.map(textFrom).filter(Boolean).join("");
}

function mapType(t: string): NodeType | undefined {
  switch (t) {
    case "paragraph":
      return NodeType.PARAGRAPH;
    case "heading":
      return NodeType.HEADING;
    case "list":
      return NodeType.LIST;
    case "listitem":
      return NodeType.LIST_ITEM;
    case "quote":
      return NodeType.QUOTE;
    case "link":
      return NodeType.LINK;
    case "text":
      return NodeType.TEXT;
    case "image":
      return NodeType.IMAGE;
    case "code":
      return NodeType.CODE_BLOCK;
    case "linebreak":
      return NodeType.LINEBREAK;
    default:
      return undefined;
  }
}

export function lexicalJsonToNodes(
  state: Lx | Record<string, any>,
): NodeInput[] {
  const out: NodeInput[] = [];
  const root = (state as Lx)?.root;
  if (!root || !Array.isArray(root.children)) return out;

  const walk = (node: any, parentKey: string | undefined, index: number) => {
    const type = mapType(node.type);
    const key =
      asKey(node.key) || `${parentKey ?? "root"}-${index}-${Date.now()}`;
    const sortOrder = index;

    if (type) {
      let payload: Record<string, any> = {};
      if (type === NodeType.TEXT) {
        payload = { text: node.text ?? "", format: node.format ?? 0 };
      } else if (type === NodeType.HEADING) {
        payload = { tag: node.tag ?? "h2" };
      } else if (type === NodeType.LIST) {
        payload = { listType: node.listType ?? "bullet" };
      } else if (type === NodeType.LINK) {
        payload = { url: node.url ?? node.href ?? "" };
      } else if (type === NodeType.IMAGE) {
        payload = { src: node.src ?? "", altText: node.altText ?? "" };
      } else if (type === NodeType.CODE_BLOCK) {
        payload = { language: node.language ?? null, code: textFrom(node) };
      } else if (type === NodeType.LINEBREAK) {
        payload = {};
      } else {
        payload = {};
      }

      out.push({
        key,
        parentKey: parentKey ?? null,
        type,
        sortOrder,
        payload,
      });
    }

    const children = Array.isArray(node.children) ? node.children : [];
    for (let i = 0; i < children.length; i++) {
      walk(children[i], key, i);
    }
  };

  for (let i = 0; i < root.children.length; i++) {
    walk(root.children[i], undefined, i);
  }

  return out;
}
