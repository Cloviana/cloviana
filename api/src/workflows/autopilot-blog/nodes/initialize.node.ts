import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../autopilot-blog.state";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");

  const blog = await prisma.blog.create({
    data: {
      storeId: state._storeId,
      currentStep: "CONTENT_TYPE",
    },
    select: { id: true },
  });

  await prisma.autopilotBlogSettings.updateMany({
    where: { autopilotSettings: { storeId: state._storeId } },
    data: { lastRunAt: new Date() },
  });

  return { _blogId: blog.id };
}
