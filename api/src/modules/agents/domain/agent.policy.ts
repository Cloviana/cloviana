import { MAX_RUN_REFERENCES } from "./attachment.policy";

export const ACTIVE_RUN_STATUSES = [
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_INPUT",
] as const;
export const TERMINAL_RUN_STATUSES = [
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;
export const RUN_TIMEOUT_MS = 30 * 60_000;
export const RUN_HEARTBEAT_INTERVAL_MS = 2_000;
export const RUN_STALE_AFTER_MS = 120_000;
export const MODEL_TOKEN_HEARTBEAT_MAX_AGE_MS = 90_000;
export const MAX_CODING_MODEL_REQUESTS = 80;
export const EVENT_PAGE_SIZE = 200;
export const MESSAGE_PAGE_SIZE = 200;
export const CONVERSATION_PAGE_SIZE = 100;
export const CONTEXT_MESSAGE_LIMIT = 60;
export const CONTEXT_CHARACTER_LIMIT = 160_000;
export const MAX_PROMPT_CHARACTERS = 30_000;
export const MAX_IDEMPOTENCY_KEY_CHARACTERS = 100;

export function isValidRunRequest(input: {
  prompt: string;
  idempotencyKey: string;
  attachmentIds?: string[];
}): boolean {
  const references = input.attachmentIds ?? [];
  return (
    input.prompt.length > 0 &&
    Array.from(input.prompt).length <= MAX_PROMPT_CHARACTERS &&
    Array.from(input.idempotencyKey).length >= 8 &&
    Array.from(input.idempotencyKey).length <= MAX_IDEMPOTENCY_KEY_CHARACTERS &&
    references.length <= MAX_RUN_REFERENCES &&
    new Set(references).size === references.length
  );
}

export function isActiveRunStatus(status: string): boolean {
  return ACTIVE_RUN_STATUSES.some((value) => value === status);
}
export function isTerminalRunStatus(status: string): boolean {
  return TERMINAL_RUN_STATUSES.some((value) => value === status);
}
