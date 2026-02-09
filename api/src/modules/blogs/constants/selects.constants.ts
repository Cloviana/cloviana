import { Prisma } from "@prisma/client";

export const BLOG_SUMMARY_SELECT: Prisma.BlogSelect = {
  id: true,
  topic: true,
  primaryKeyword: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  storeId: true,
  thumbnail: { select: { blobPath: true, altText: true } },
  job: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      error: true,
    },
  },
};

export const BLOG_DETAIL_SELECT: Prisma.BlogSelect = {
  id: true,
  title: true,
  topic: true,
  primaryKeyword: true,
  secondaryKeywords: true,
  currentStep: true,
  slug: true,
  description: true,
  brandVoice: true,
  status: true,
  storeId: true,
  jobId: true,
  thumbnail: { select: { blobPath: true, altText: true } },
  job: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      error: true,
    },
  },
  nodes: {
    orderBy: [{ sortOrder: "asc" }, { parentKey: "asc" }],
    select: {
      key: true,
      parentKey: true,
      sortOrder: true,
      type: true,
      payload: true,
    },
  },
  contentType: true,
  products: {
    select: {
      id: true,
      title: true,
      imageUrl: true,
      url: true,
    },
  },
};
