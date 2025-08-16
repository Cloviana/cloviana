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
  if (!Array.isArray(state._products) || state._products.length === 0) return {};

  const storeId = state._storeId;

  await prisma.$transaction(
    state._products.map((p) => {
      const img = pickMainImage(p);
      return prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          storeId,
          handle: p.handle,
          title: p.title,
          status: p.status as ShopifyProductStatus,
          description: p.description ?? null,
          tags: p.tags ?? [],
          mainImageUrl: img.url,
          mainImageAlt: img.alt,
          updatedAtShopify: new Date(p.updatedAt),
        },
        update: {
          handle: p.handle,
          title: p.title,
          status: p.status as ShopifyProductStatus,
          description: p.description ?? null,
          tags: p.tags ?? [],
          mainImageUrl: img.url,
          mainImageAlt: img.alt,
          updatedAtShopify: new Date(p.updatedAt),
        },
      });

      // DELETE ANY ONE THAT IS NOT IN THE LIST
    })
  );

  return {};
}
