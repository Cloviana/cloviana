import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../sync-products.state";
import { PrismaClient, ShopifyProductStatus } from "@prisma/client";

export async function saveProducts(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");
  if (!state._storeId) throw new Error("Missing storeId");
  if (!Array.isArray(state._products) || state._products.length === 0) return {};

  const storeId = state._storeId;
  const ids = state._products.map(p => p.id);

  await prisma.$transaction(async (tx) => {
    for (const p of state._products) {
      const data = {
        handle: p.handle ?? null,
        title: p.title,
        status: p.status as ShopifyProductStatus,
        description: p.description ?? null,
        tags: p.tags ?? [],
        category: p.category?.name ?? null,
        imageUrl: p.featuredMedia?.preview?.image?.url ?? null,
        onlineStoreUrl: p.onlineStoreUrl ?? null,
        onlineStorePreviewUrl: p.onlineStorePreviewUrl ?? "",
      };

      const changed = await tx.product.updateMany({
        where: {
          storeId,
          shopifyId: p.id,
          OR: [
            { handle: { not: data.handle } },
            { title: { not: data.title } },
            { status: { not: data.status } },
            { description: { not: data.description } },
            { category: { not: data.category } },
            { imageUrl: { not: data.imageUrl } },
            { onlineStoreUrl: { not: data.onlineStoreUrl } },
            { onlineStorePreviewUrl: { not: data.onlineStorePreviewUrl } },
            { NOT: { tags: { equals: data.tags } } },
          ],
        },
        data: { ...data, syncedAt: new Date() },
      });

      if (changed.count === 0) {
        await tx.product.upsert({
          where: { storeId_shopifyId: { storeId, shopifyId: p.id } },
          create: { storeId, shopifyId: p.id, ...data, syncedAt: new Date() },
          update: {},
        });
      }
    }

    await tx.product.deleteMany({
      where: { storeId, shopifyId: { notIn: ids } },
    });
  });

  return {};
}
