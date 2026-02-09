import { SuggestionsService } from "@/modules/blogs/services/suggestions.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../autopilot-blog.state";

export async function selectTopic(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");
  const suggestions = configurable?.suggestions as SuggestionsService | undefined;
  if (!suggestions) throw new Error("suggestions service not provided");

  if (!state._blogId) throw new Error("blogId not found in state");

  const blog = await prisma.blog.findUnique({
    where: { id: state._blogId },
    select: { products: { select: { id: true } } },
  });

  if (!blog?.products?.length) {
    throw new Error("Product selection is required before topic selection");
  }

  const topics = await suggestions.suggestTopic(state._blogId);
  const topic = topics?.[0]?.trim();
  if (!topic) throw new Error("Topic selection failed");

  await prisma.blog.update({
    where: { id: state._blogId },
    data: {
      topic,
      currentStep: "PRIMARY_KEYWORD",
    },
  });

  return {};
}
