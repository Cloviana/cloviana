/**
 * What the assistant did during a run, as an ordered list of parts. The browser renders this list
 * live from `part.upsert` and `part.delta` events and later from the saved message, so a reload
 * shows exactly what the stream showed. The admin app mirrors these types in
 * `features/themes/editor/chat/model/part.ts`: change both together.
 */

export type ToolStatus = "pending" | "running" | "completed" | "error";
export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface TextPart {
  id: string;
  type: "text";
  text: string;
}

export interface ReasoningPart {
  id: string;
  type: "reasoning";
  text: string;
  startedAt: number;
  endedAt?: number;
}

/** A file change a tool made. The patch is a unified diff, already truncated. */
export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface ToolPart {
  id: string;
  type: "tool";
  /** Tool name as the coding agent reports it, e.g. `read`, `edit`, `bash`. */
  tool: string;
  status: ToolStatus;
  /** Short human label, e.g. the file a read or edit targets. */
  title?: string;
  /** One-line summary of the arguments. */
  input?: string;
  output?: string;
  diff?: FileDiff;
  startedAt?: number;
  endedAt?: number;
}

export interface TodoItem {
  content: string;
  status: TodoStatus;
}

export interface TodosPart {
  id: string;
  type: "todos";
  items: TodoItem[];
}

export interface NoticePart {
  id: string;
  type: "notice";
  level: "info" | "warning" | "error";
  text: string;
}

export type TranscriptPart =
  | TextPart
  | ReasoningPart
  | ToolPart
  | TodosPart
  | NoticePart;

/** What is saved with an assistant message: the answer text plus every part, in order. */
export interface SavedTranscript {
  text: string;
  parts: TranscriptPart[];
  /** The revision this run saved, so the conversation can offer to go back to before it. */
  revisionId?: string;
}

/** Event payloads on the run stream. */
export interface PartUpsertEvent {
  part: TranscriptPart;
}
export interface PartDeltaEvent {
  id: string;
  text: string;
}

export const PART_UPSERT_EVENT = "part.upsert";
export const PART_DELTA_EVENT = "part.delta";

/** Bounds on everything that reaches the browser or the database. */
export const TRANSCRIPT_LIMITS = {
  parts: 500,
  text: 40_000,
  reasoning: 8_000,
  toolInput: 500,
  toolOutput: 4_000,
  toolTitle: 300,
  diffPatch: 8_000,
  todos: 30,
  todoContent: 300,
  notice: 1_000,
} as const;
