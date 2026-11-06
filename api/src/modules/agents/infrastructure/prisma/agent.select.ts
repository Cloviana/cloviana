import type { Prisma } from "@prisma/client";

export const runSelect = {
  id: true,
  marketplaceId: true,
  conversationId: true,
  themeId: true,
  mode: true,
  baseRevisionId: true,
  resultRevisionId: true,
  requestedBy: true,
  attachmentIds: true,
  modelProvider: true,
  modelName: true,
  status: true,
  cancelRequestedAt: true,
  errorCode: true,
  errorSummary: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
} satisfies Prisma.AgentRunSelect;
export const conversationSelect = {
  id: true,
  marketplaceId: true,
  title: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AgentConversationSelect;
