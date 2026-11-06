export type Json =
  | null
  | string
  | number
  | boolean
  | Json[]
  | { [key: string]: Json };
export type AgentRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING_FOR_INPUT"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";
export type AgentMessageRole = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
export interface Conversation {
  id: string;
  marketplaceId: string;
  title: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Message {
  id: string;
  sequence: string;
  role: AgentMessageRole;
  content: Json;
  createdAt: Date;
}
export interface Run {
  id: string;
  marketplaceId: string;
  conversationId: string;
  themeId: string | null;
  baseRevisionId: string | null;
  resultRevisionId: string | null;
  requestedBy: string;
  attachmentIds: string[];
  modelProvider: string | null;
  modelName: string | null;
  status: AgentRunStatus;
  cancelRequestedAt: Date | null;
  errorCode: string | null;
  errorSummary: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}
export interface RunEvent {
  id: string;
  sequence: string;
  type: string;
  payload: Json;
  createdAt: Date;
}

export interface QueueAgentRunInput {
  marketplaceId: string;
  conversationId: string;
  ownerId: string;
  prompt: string;
  idempotencyKey: string;
  themeId?: string;
  baseRevisionId?: string;
  attachmentIds?: string[];
}

export interface AgentUsageInput {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  costMicros?: number;
}
