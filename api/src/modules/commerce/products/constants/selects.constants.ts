import { Prisma } from "@prisma/client";

export const PRODUCT_SUMMARY_SELECT: Prisma.ProductSelect = {
  title: true,
  status: true,
  imageUrl: true,
  category: true,
  onlineStorePreviewUrl: true,
  onlineStoreUrl: true,
  handle: true,
  syncedAt: true,
};
