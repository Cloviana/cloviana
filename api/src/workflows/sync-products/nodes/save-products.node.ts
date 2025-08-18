import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../sync-products.state";
import { PrismaClient, ShopifyProductStatus } from "@prisma/client";
import { Product } from "@/clients/shopify/generated";

function pickMainImage(p: Product) {
  const node = (p.media?.nodes ?? []).find((n: any) => n?.image?.url);
  return {
    url: (node as any)?.image?.url ?? null,
    alt: (node as any)?.image?.altText ?? null,
  };
}

export async function saveProducts(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");
  if (!state._storeId) throw new Error("Missing storeId");
  if (!Array.isArray(state._products) || state._products.length === 0) return {};

  const storeId = state._storeId;
  const incomingShopifyIds = state._products.map(p => p.id);

  await prisma.$transaction([
    ...state._products.map((p) => {
      const img = pickMainImage(p);
      return prisma.product.upsert({
        where: { storeId_shopifyId: { storeId, shopifyId: p.id } },
        create: {
          storeId,
          shopifyId: p.id,
          handle: p.handle,
          title: p.title,
          status: p.status as ShopifyProductStatus,
          description: p.description ?? null,
          tags: p.tags ?? [],
          mainImageUrl: img.url,
          mainImageAlt: img.alt,
        },
        update: {
          handle: p.handle,
          title: p.title,
          status: p.status as ShopifyProductStatus,
          description: p.description ?? null,
          tags: p.tags ?? [],
          mainImageUrl: img.url,
          mainImageAlt: img.alt,
        },
      });
    }),
    prisma.product.deleteMany({
      where: {
        storeId,
        shopifyId: { notIn: incomingShopifyIds },
      },
    }),
  ]);

  return {};
}
