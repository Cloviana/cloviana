import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { StateAnnotation } from "../autopilot-blog.state";

export async function selectProducts(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");
  if (!state._blogId) throw new Error("blogId not found in state");

  const settings = await prisma.autopilotSettings.findUnique({
    where: { storeId: state._storeId },
    select: {
      blog: {
        select: {
          collections: { select: { id: true } },
        },
      },
    },
  });

  const collectionIds =
    settings?.blog?.collections.map((c) => c.id) ?? [];

  const blog = await prisma.blog.findUnique({
    where: { id: state._blogId },
    select: { contentType: true },
  });
  const contentType = blog?.contentType ?? "PROBLEM_SOLUTION";
  const maxProducts = contentType === "COMPARISON" ? 2 : 1;

  const candidates = await prisma.product.findMany({
    where: {
      storeId: state._storeId,
      status: ProductStatus.ACTIVE,
      ...(collectionIds.length
        ? { collections: { some: { id: { in: collectionIds } } } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!candidates.length) {
    throw new Error("No eligible products found for autopilot");
  }

  if (candidates.length <= maxProducts) {
    const selected = candidates.map((p) => p.id).slice(0, maxProducts);
    await prisma.blog.update({
      where: { id: state._blogId },
      data: {
        currentStep: "TOPIC",
        products: { set: selected.map((id) => ({ id })) },
      },
    });
    return {};
  }

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs(
    "nodes/select-products",
    {
      metadata: {
        contentType,
        maxProducts,
      },
    },
    { baseDir },
  );

  const schema = z.object({
    productIds: z.array(z.string().min(1)).min(1).max(maxProducts),
  });

  const groq = new GroqClient();

  const { productIds } = await groq.chatJson<
    z.infer<typeof schema>
  >({
    name: "autopilot_select_products",
    schema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          contentType,
          maxProducts,
          candidates,
        }),
      },
    ],
    temperature: 0.2,
    topP: 0.9,
    reasoningEffort: "low",
  });

  const allowed = new Set(candidates.map((c) => c.id));
  const selected = productIds.filter((id) => allowed.has(id));

  if (!selected.length) {
    const fallback = candidates.map((p) => p.id).slice(0, maxProducts);
    await prisma.blog.update({
      where: { id: state._blogId },
      data: {
        currentStep: "TOPIC",
        products: { set: fallback.map((id) => ({ id })) },
      },
    });
    return {};
  }

  const finalIds = selected.slice(0, maxProducts);

  await prisma.blog.update({
    where: { id: state._blogId },
    data: {
      currentStep: "TOPIC",
      products: { set: finalIds.map((id) => ({ id })) },
    },
  });

  return {};
}
