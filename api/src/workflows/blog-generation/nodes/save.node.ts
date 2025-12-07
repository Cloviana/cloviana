import { StorageService } from "@/infrastructure/storage/storage.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { NodeType as DbNodeType, NodeType, PrismaClient } from "@prisma/client";
import cuid from "cuid";
import { StateAnnotation } from "../blog-generation.state";
import { Node } from "../schemas/node.schemas";

type TextFormat = "bold" | "italic" | "underline";

type FlatRow = {
  blogId: string;
  key: string;
  parentKey: string | null;
  type: DbNodeType;
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

function toRows(
  blogId: string,
  nodes: Node[],
  parentKey: string | null,
): FlatRow[] {
  const rows: FlatRow[] = [];
  nodes.forEach((n, idx) => {
    const key = cuid();
    const type = n.type as NodeType;
    let payload: any = {};
    if (n.type === "TEXT") {
      payload = {
        text: n.text,
        format: formatArrayToLexical(n.format ?? null),
      };
    } else if (n.type === "HEADING") {
      payload = { tag: n.tag };
    } else if (n.type === "LIST") {
      payload = { listType: n.listType };
    } else if (n.type === "LINK") {
      payload = { url: n.url };
    } else {
      payload = {};
    }
    rows.push({ blogId, key, parentKey, type, sortOrder: idx, payload });
    const children = (n as any).children as Node[] | undefined;
    if (children && children.length)
      rows.push(...toRows(blogId, children, key));
  });
  return rows;
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
  const nodes = state._nodes;
  if (!Array.isArray(nodes) || nodes.length === 0)
    throw new Error("No nodes to save");

  const rows = toRows(blogId, nodes as Node[], null);

  const slug = state._outline.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const base64Data = state._image.url.replace(/^data:image\/\w+;base64,/, "");
  const data = Buffer.from(base64Data, "base64");
  const blobPath = `thumbnails/${blogId}/thumbnail.png`;

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
      
      await tx.thumbnail.upsert({
        where: { blogId },
        update: { altText: state._image.alt, blobPath },
        create: { blogId, altText: state._image.alt, blobPath },
      });
      
    },
    { timeout: 60_000, maxWait: 20_000 },
  );

  
  try {
    await storage.upload(blobPath, data, "image/png");
  } catch (e) {
    await prisma.thumbnail.delete({ where: { blogId } }).catch(() => {});
    throw e;
  }
  
  return {};
}