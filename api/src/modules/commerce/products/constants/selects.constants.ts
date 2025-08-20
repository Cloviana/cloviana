import { Prisma } from "@prisma/client";

export const PRODUCT_SUMMARY_SELECT: Prisma.ProductSelect = {
  title: true,
  status: true,
  mainImageAlt: true,
  mainImageUrl: true,
  updatedAt: true,
};

