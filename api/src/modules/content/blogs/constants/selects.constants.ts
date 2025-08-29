import { Prisma } from "@prisma/client";

export const BLOG_SUMMARY_SELECT: Prisma.BlogSelect = {
  id: true,
  title: true,
  topic: true,
  publishStatus: true,
  generationStep: true,
  createdAt: true,
  updatedAt: true,
  keyword: { select: { id: true, phrase: true } },
  job: { select: { id: true, status: true, startedAt: true, finishedAt: true, error: true } },
};

export const BLOG_DETAIL_SELECT: Prisma.BlogSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  brandVoice: true,
  publishStatus: true,
  generationStep: true,
  storeId: true,
  keyword: { select: { id: true, phrase: true } },
  thumbnail: { select: { blobPath: true, altText: true} },
  job: { select: { id: true, status: true, startedAt: true, finishedAt: true, error: true } },
  nodes: {
    orderBy: [{ sortOrder: "asc" }, { parentKey: "asc" }],
    select: { key: true, parentKey: true, sortOrder: true, type: true, payload: true },
  },
};
