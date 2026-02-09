import { SuggestionsService } from "@/modules/blogs/services/suggestions.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../autopilot-blog.state";

export async function selectPrimaryKeyword(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");
  const suggestions = configurable?.suggestions as SuggestionsService | undefined;
  if (!suggestions) throw new Error("suggestions service not provided");
  if (!state._blogId) throw new Error("blogId not found in state");

  const keywords = await suggestions.suggestPrimaryKeyword(state._blogId);
  const recommended = keywords.find((k) => k.recommended)?.keyword;
  const primaryKeyword = (recommended ?? keywords[0]?.keyword ?? "").trim();

  if (!primaryKeyword) throw new Error("Primary keyword selection failed");

  await prisma.blog.update({
    where: { id: state._blogId },
    data: {
      primaryKeyword,
      secondaryKeywords: [],
      currentStep: "SECONDARY_KEYWORDS",
    },
  });

  return {};
}
