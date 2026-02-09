import { SuggestionsService } from "@/modules/blogs/services/suggestions.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../autopilot-blog.state";

export async function selectSecondaryKeywords(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");
  const suggestions = configurable?.suggestions as SuggestionsService | undefined;
  if (!suggestions) throw new Error("suggestions service not provided");
  if (!state._blogId) throw new Error("blogId not found in state");

  const rows = await suggestions.suggestSecondaryKeywords(state._blogId);
  const recommended = rows.filter((r) => r.recommended).map((r) => r.keyword);
  const selected =
    recommended.length > 0
      ? recommended.slice(0, 5)
      : rows.map((r) => r.keyword).slice(0, 5);

  if (!selected.length) {
    throw new Error("Secondary keywords selection failed");
  }

  await prisma.blog.update({
    where: { id: state._blogId },
    data: {
      secondaryKeywords: selected,
      currentStep: "COMPLETED",
    },
  });

  return {};
}
