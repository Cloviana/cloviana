import { PrismaClient, NodeType as DbNodeType } from "@prisma/client";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../blog-generation.state";
import { Node } from "../schemas/node.schemas";
import cuid from "cuid";
import { StorageService } from "@/modules/core/storage/storage.service";
import axios from "axios";

type TextFormat = "bold" | "italic" | "underline";

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

function mapType(n: Node): DbNodeType {
  switch (n.type) {
    case "paragraph":
      return "PARAGRAPH";
    case "heading":
      return "HEADING";
    case "list":
      return "LIST";
    case "listitem":
      return "LIST_ITEM";
    case "quote":
      return "QUOTE";
    case "image":
      return "IMAGE";
    case "link":
      return "LINK";
    case "text":
      return "TEXT";
    default:
      return "PARAGRAPH";
  }
}

type FlatRow = {
  blogId: string;
  key: string;
  parentKey: string | null;
  type: DbNodeType;
  sortOrder: number;
  payload: any;
};

function toRows(
  blogId: string,
  nodes: Node[],
  parentKey: string | null,
): FlatRow[] {
  const rows: FlatRow[] = [];
  nodes.forEach((n, idx) => {
    const key = cuid();
    const type = mapType(n);
    let payload: any = {};
    if (n.type === "text") {
      payload = {
        text: n.text,
        format: formatArrayToLexical(n.format ?? null),
      };
    } else if (n.type === "heading") {
      payload = { tag: n.tag };
    } else if (n.type === "list") {
      payload = { listType: n.listType };
    } else {
      payload = {};
    }
    rows.push({ blogId, key, parentKey, type, sortOrder: idx, payload });
    const children = (n as any).children as Node[] | undefined;
    if (children && children.length) {
      rows.push(...toRows(blogId, children, key));
    }
  });
  return rows;
}

export async function save(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[save] start");
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");
  const storage = configurable?.storage as StorageService;
  if (!storage) throw new Error("Storage service not provided");
  const blogId = state._blogId;
  if (!blogId) throw new Error("blogId missing in state");
  const nodes = state._nodes;
  if (!Array.isArray(nodes) || nodes.length === 0)
    throw new Error("No nodes to save");

  console.debug("[save] input nodes:", nodes.length);
  const rows = toRows(blogId, nodes as Node[], null);
  console.info("[save] flattened rows:", rows.length);

  const slug = state._metadata.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const { data: arrayBuf } = await axios.get<ArrayBuffer>(state._image.url, {
    responseType: "arraybuffer",
  });
  const data = Buffer.from(arrayBuf);

  await prisma.$transaction(
    async (tx) => {
      console.info("[save] clearing existing nodes for blogId:", blogId);
      await tx.node.deleteMany({ where: { blogId } });
      console.info("[save] inserting rows");
      await tx.node.createMany({ data: rows });

      await tx.blog.update({
        where: { id: blogId },
        data: { slug },
      });

      const blobPath = `thumbnails/${blogId}/thumbnail.png`;

      await tx.thumbnail.create({
        data: {
          blogId,
          altText: state._image.alt,
          blobPath,
        },
      });

      await storage.upload(blobPath, Buffer.from(data), "image/png");
    },
    {
      timeout: 60_000,
      maxWait: 20_000,
    },
  );

  console.info("[save] success");
  return {};
}
