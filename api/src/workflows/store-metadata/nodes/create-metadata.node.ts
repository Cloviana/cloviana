import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../store-metadata.state";
import { PrismaClient } from "@prisma/client";
import z from "zod";
import pRetry from "p-retry";
import { ChatOpenAI } from "@langchain/openai";

const ResponseSchema = z.object({
  brandDescription: z
    .string()
    .min(40)
    .max(300)
    .describe(
      "An excellent detailed yet coincised brand description of the store.",
    ),
});

export async function createMetadata(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const storeId = state._storeId;
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: storeId },
  });

  const llm = new ChatOpenAI({
    model: "gpt-4.1-mini",
  }).withStructuredOutput(ResponseSchema, { strict: true });

  const { brandDescription } = await pRetry(
    async () => {
      const res = await llm.invoke([
        {
          type: "system",
          content: [
            "You are a professional in summarizing content for shopify stores.",
            "You are given a list of collections, products, and the first 5 articles of a shopify store",
            "Using this information you should provide a very clear brand description, that clearly summarizes the brand's offering, perceived target customers if possible (don't assume).",
            "In general the description should be good enough to be used other times as clear overview of the business.",
            "This is a very good example: 'Lustrao is a modern beauty brand that focuses on clean, effective, and science-backed skincare. Our mission is to make skincare simple and empowering by combining nature-inspired ingredients with dermatologist-approved formulations. We believe in routines that are easy to follow, gentle on the skin, and designed to help everyone glow with confidence.'",
          ].join("\n"),
        },
        {
          type: "human",
          content: JSON.stringify(
            {
              metadata: {
                name: store.name,
              },
              collection: state._collections,
              products: state._products,
              articles: state._articles,
            },
            null,
            2,
          ),
        },
      ]);
      return res;
    },
    {
      retries: 3,
      minTimeout: 3000,
      maxTimeout: 5000,
      onFailedAttempt: (context) =>
        console.warn(
          `[createMetadata] retry ${context.attemptNumber}/3 failed. Error: ${context.message}`,
        ),
    },
  );

  await prisma.store.update({
    where: { id: storeId },
    data: { description: brandDescription },
  });

  return {};
}
