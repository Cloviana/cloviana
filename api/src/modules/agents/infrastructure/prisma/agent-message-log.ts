import { Prisma } from "@prisma/client";
import type { AgentMessageRole, Json } from "../../domain/agent.types";

/** Caller must hold the conversation row lock for the whole transaction. */
export async function appendConversationMessage(
  tx: Prisma.TransactionClient,
  input: {
    marketplaceId: string;
    conversationId: string;
    role: AgentMessageRole;
    content: Json;
    createdBy?: string;
  },
) {
  const last = await tx.agentMessage.findFirst({
    where: {
      marketplaceId: input.marketplaceId,
      conversationId: input.conversationId,
    },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  return tx.agentMessage.create({
    data: {
      ...input,
      content: input.content === null ? Prisma.JsonNull : input.content,
      sequence: (last?.sequence ?? 0n) + 1n,
    },
  });
}

/** Caller must hold the run row lock (creating/updating that run also holds it). */
export async function appendRunEvent(
  tx: Prisma.TransactionClient,
  input: {
    marketplaceId: string;
    runId: string;
    type: string;
    payload: Json;
  },
) {
  const last = await tx.agentRunEvent.findFirst({
    where: { marketplaceId: input.marketplaceId, runId: input.runId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  return tx.agentRunEvent.create({
    data: {
      ...input,
      payload: input.payload === null ? Prisma.JsonNull : input.payload,
      sequence: (last?.sequence ?? 0n) + 1n,
    },
  });
}
