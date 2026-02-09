import { PrismaClient } from "@prisma/client";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../autopilot-blog.state";

export async function selectContentType(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");
  if (!state._blogId) throw new Error("blogId not found in state");

  const settings = await prisma.autopilotSettings.findUnique({
    where: { storeId: state._storeId },
    select: { blog: { select: { contentMix: true } } },
  });

  const mix = settings?.blog?.contentMix ?? "BALANCED";

  if (mix === "PROBLEM_SOLUTION" || mix === "COMPARISON") {
    await prisma.blog.update({
      where: { id: state._blogId },
      data: {
        contentType: mix,
        currentStep: "PRODUCT",
      },
    });
    return {};
  }

  const lastAutopilotBlog = await prisma.blog.findFirst({
    where: { storeId: state._storeId },
    select: { contentType: true },
    orderBy: { createdAt: "desc" },
  });

  const last = lastAutopilotBlog?.contentType ?? "PROBLEM_SOLUTION";
  const next = last === "PROBLEM_SOLUTION" ? "COMPARISON" : "PROBLEM_SOLUTION";

  await prisma.blog.update({
    where: { id: state._blogId },
    data: {
      contentType: next,
      currentStep: "PRODUCT",
    },
  });

  return {};
}
