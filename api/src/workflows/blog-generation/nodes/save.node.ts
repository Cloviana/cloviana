import { StorageService } from "@/infrastructure/storage/storage.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { NodeType, PrismaClient } from "@prisma/client";
import cuid from "cuid";
import { StateAnnotation } from "../blog-generation.state";
import { Node } from "../schemas/node.schemas";
import { markdownToEditorState } from "@/workflows/blog-generation/utils/markdown-to-editor-state";

type TextFormat = "bold" | "italic" | "underline";

type FlatRow = {
  blogId: string;
  key: string;
  parentKey: string | null;
  type: NodeType;
  sortOrder: number;
  payload: any;
};

function formatArrayToLexical(format: TextFormat[] | null): number {
  if (!format || !format.length) return 0;
  let v = 0;
  for (const f of format) {
    if (f === "bold") v |= 1;
    else if (f === "italic") v |= 2;
    else if (f === "underline") v |= 8;
  }
  return v;
}

function nodePayload(n: any): any {
  if (n.type === "TEXT") {
    return {
      text: n.text ?? "",
      format: formatArrayToLexical(n.format ?? null),
    };
  }

  if (n.type === "HEADING") {
    return { tag: n.tag };
  }

  if (n.type === "LIST") {
    return { listType: n.listType };
  }

  if (n.type === "LINK") {
    return { url: n.url };
  }

  if (n.type === "IMAGE") {
    return {
      src: n.src ?? "",
      altText: n.altText ?? "",
    };
  }

  return {};
}

function getChildren(n: any): Node[] {
  return Array.isArray(n?.children) ? (n.children as Node[]) : [];
}

function toRows(
  blogId: string,
  nodes: Node[],
  parentKey: string | null,
): FlatRow[] {
  const rows: FlatRow[] = [];

  nodes.forEach((n: any, idx: number) => {
    const key = cuid();
    const type = n.type as NodeType;

    rows.push({
      blogId,
      key,
      parentKey,
      type,
      sortOrder: idx,
      payload: nodePayload(n),
    });

    const children = getChildren(n);
    if (children.length) rows.push(...toRows(blogId, children, key));
  });

  return rows;
}

function toBlobPathFromUrlOrPath(input: string): string {
  const s = input.trim();
  if (!s) return s;
  if (s.startsWith("data:")) return s;

  try {
    const u = new URL(s);
    const p = u.pathname.replace(/^\/+/, "");
    const idx = p.indexOf("uploads/");
    if (idx >= 0) return p.slice(idx + "uploads/".length);
    return p;
  } catch {
    return s.replace(/^\/+/, "");
  }
}

export async function save(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const storage = configurable?.storage as StorageService;
  if (!storage) throw new Error("Storage service not provided");

  const blogId = state._blogId;
  if (!blogId) throw new Error("blogId missing in state");

  const nodes = markdownToEditorState(state._draft).root.children;
  if (!Array.isArray(nodes) || nodes.length === 0)
    throw new Error("No nodes to save");

  const rows = toRows(blogId, nodes as Node[], null);

  const slug = state._outline.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const thumbUrl = (state._outline as any)?.thumbnail?.url as string | undefined;
  const thumbAlt = (state._outline as any)?.thumbnail?.altText as string | undefined;

  const thumbBlobPath =
    thumbUrl && !thumbUrl.startsWith("data:")
      ? toBlobPathFromUrlOrPath(thumbUrl)
      : undefined;

  await prisma.$transaction(
    async (tx) => {
      await tx.node.deleteMany({ where: { blogId } });
      await tx.node.createMany({ data: rows });

      await tx.blog.update({
        where: { id: blogId },
        data: {
          slug,
          description: state._outline.metaData.description,
          title: state._outline.title,
        },
      });

      if (thumbUrl && thumbAlt && thumbBlobPath) {
        await tx.thumbnail.upsert({
          where: { blogId },
          update: { altText: thumbAlt, blobPath: thumbBlobPath },
          create: { blogId, altText: thumbAlt, blobPath: thumbBlobPath },
        });
      }
    },
    { timeout: 60_000, maxWait: 20_000 },
  );

  return {};
}
