import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../blog-generation.state";
import { PrismaClient } from "@prisma/client";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: state._blogId },
    include: { store: true },
  });

  return {
    _metadata: {
      title: blog.title!,
      topic: blog.topic!,
      keyword: blog.primaryKeyword!,
      brandVoice: blog.brandVoice,
      brandName: blog.store.name,
      brandDescription: blog.store.description!,
      blogLength: {
        min: 1000,
        max: 1300,
      },
    },
  };
}
