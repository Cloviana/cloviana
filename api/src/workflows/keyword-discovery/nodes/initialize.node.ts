import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../keyword-discovery.state";
import { PrismaClient } from "@prisma/client";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const channel = await prisma.channel.findUniqueOrThrow({
    where: { storeId: state._storeId },
  });

  const { offlineAccessToken } = channel.config as {
    offlineAccessToken: string;
  };

  return {
    _token: offlineAccessToken,
    _shop: channel.shop,
  };
}
