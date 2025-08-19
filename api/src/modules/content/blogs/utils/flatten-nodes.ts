import cuid from "cuid";
import { Prisma } from "@prisma/client";
import { NodePayload } from "../agents/blog-writer";

export function flattenNodes(
  nodes: NodePayload[],
  blogId: string,
  parentKey: string | null = null,
): Prisma.NodeCreateManyInput[] {
  const result: Prisma.NodeCreateManyInput[] = [];

  nodes.forEach((node, idx) => {
    const key = cuid();

    result.push({
      blogId,
      key,
      parentKey,
      sortOrder: idx,
      type: node.type,
      payload: node,
    });

    if (node.type !== "TEXT") {
      if (Array.isArray(node.children) && node.children.length > 0) {
        result.push(
          ...flattenNodes(node.children as NodePayload[], blogId, key),
        );
      }
    }
  });

  return result;
}
