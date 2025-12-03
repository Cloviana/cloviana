import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../blog-generation.state";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: state._blogId },
    include: { store: true, products: true, collections: true },
  });

  return {
    _metadata: {
      topic: blog.topic!,
      primaryKeyword: blog.primaryKeyword!,
      secondaryKeywords: blog.secondaryKeywords!,
      products: blog.products.map((product) => ({
        url: product?.url!,
        title: product.title!,
        description: product.description!,
      })),
      collections: blog.collections.map((collection) => ({
        url: collection?.url!,
        title: collection.title!,
        description: collection.description!,
      })),
      brandVoice: blog.brandVoice,
      targetPersona: blog.targetPersona!,
      searchIntent: blog.searchIntent!,

      brandName: blog.store.name,
      brandDescription: blog.store.description!,
      blogLength: {
        min: 500,
        max: 800,
      },
    },
  };
}
