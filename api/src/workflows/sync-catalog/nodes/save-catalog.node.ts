import { Collection, Product } from "@/clients/shopify/generated";
import { RunnableConfig } from "@langchain/core/runnables";
import { Prisma, PrismaClient, ProductStatus } from "@prisma/client";
import { StateAnnotation } from "../sync-catalog.state";

const UPSERT_BATCH_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

const mapCollectionToUpsert = (
  c: Collection,
  storeId: string,
  shop: string,
): Prisma.CollectionUpsertArgs => {
  const data = {
    title: c.title,
    slug: c.handle ?? null,
    description: c.description ?? null,
    imageUrl: c.image?.url ?? null,
    url: `https://${shop}/collections/${c.handle}`,
    metadata: {
      altText: c.image?.altText ?? null,
    },
  };

  return {
    where: {
      storeId_externalId: {
        storeId,
        externalId: c.id,
      },
    },
    create: {
      storeId,
      externalId: c.id,
      ...data,
    },
    update: {
      ...data,
    },
  };
};

const mapProductToUpsert = (
  p: Product,
  storeId: string,
  shop: string,
): Prisma.ProductUpsertArgs => {
  const collectionConnections =
    p.collections?.nodes?.map((c: any) => ({
      storeId_externalId: {
        storeId,
        externalId: c.id,
      },
    })) || [];

  const metadata = {
    tags: p.tags ?? [],
    category: p.category?.name ?? null,
  };

  const data = {
    slug: p.handle ?? null,
    title: p.title,
    status: p.status as ProductStatus,
    description: p.description ?? null,
    imageUrl: p.featuredMedia?.preview?.image?.url ?? null,
    url: p.onlineStoreUrl ?? `https://${shop}/products/${p.handle}`,
    metadata: metadata,
  };

  return {
    where: { storeId_externalId: { storeId, externalId: p.id } },
    create: {
      storeId,
      externalId: p.id,
      ...data,
      collections: {
        connect: collectionConnections,
      },
    },
    update: {
      ...data,
      collections: {
        set: collectionConnections,
      },
    },
  };
};

export async function saveCatalog(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");
  if (!state._storeId) throw new Error("Missing storeId");
  if (!state._shop) throw new Error("Missing shop domain");

  const storeId = state._storeId;
  const shop = state._shop;
  const collections = state._collections || [];
  const products = state._products || [];

  if (collections.length === 0 && products.length === 0) return {};

  for (const batch of chunk(collections, UPSERT_BATCH_SIZE)) {
    await prisma.$transaction(
      batch.map((c) =>
        prisma.collection.upsert(mapCollectionToUpsert(c, storeId, shop)),
      ),
    );
  }

  for (const batch of chunk(products, UPSERT_BATCH_SIZE)) {
    await prisma.$transaction(
      batch.map((p) =>
        prisma.product.upsert(mapProductToUpsert(p, storeId, shop)),
      ),
    );
  }

  const productIds = products.map((p) => p.id);
  const collectionIds = collections.map((c) => c.id);

  await Promise.all([
    prisma.product.deleteMany({
      where: { storeId, externalId: { notIn: productIds } },
    }),
    prisma.collection.deleteMany({
      where: { storeId, externalId: { notIn: collectionIds } },
    }),
  ]);

  return {};
}
