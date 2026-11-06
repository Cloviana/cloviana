import { PROJECT_ROOT } from "@/integrations/sandbox/sandbox.constants";
import type {
  ToolPart as OpenCodeToolPart,
  Part,
} from "@opencode-ai/sdk/v2/client";
import type {
  FileDiff,
  TodoItem,
  TodoStatus,
  TranscriptPart,
} from "../../domain/transcript";

/** The coding agent keeps one todo list per session; it is always the same part. */
export const TODOS_PART_ID = "todos";

const ROOT = `${PROJECT_ROOT}/`;
const TODO_STATUSES: readonly string[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];
const EDIT_TOOLS = new Set(["edit", "write", "patch", "multiedit"]);

/** Which argument says what a tool is working on. */
const SUBJECT_KEY: Record<string, string> = {
  read: "filePath",
  edit: "filePath",
  write: "filePath",
  patch: "filePath",
  multiedit: "filePath",
  grep: "pattern",
  glob: "pattern",
  list: "path",
  bash: "command",
  task: "description",
};

/** Sandbox paths mean nothing to the user and reveal the machine layout. */
const relative = (value: string) => value.replaceAll(ROOT, "");

const asString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

function summarizeInput(tool: string, input: Record<string, unknown>) {
  const key = SUBJECT_KEY[tool];
  const subject = key ? asString(input[key]) : undefined;
  if (subject) {
    return relative(subject);
  }
  const keys = Object.keys(input);
  return keys.length ? relative(JSON.stringify(input)) : undefined;
}

/** Counts changed lines in a unified diff, ignoring the file headers. */
function countChanges(patch: string) {
  let additions = 0;
  let deletions = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions += 1;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions += 1;
    }
  }
  return { additions, deletions };
}

function diffOf(
  tool: string,
  input: Record<string, unknown>,
  metadata: Record<string, unknown> | undefined,
): FileDiff | undefined {
  if (!EDIT_TOOLS.has(tool)) {
    return undefined;
  }
  const patch = asString(metadata?.diff);
  if (!patch) {
    return undefined;
  }
  const filediff = metadata?.filediff as { file?: unknown } | undefined;
  const path = asString(filediff?.file) ?? asString(input.filePath) ?? "";
  return {
    path: relative(path),
    patch: relative(patch),
    ...countChanges(patch),
  };
}

/** What a finished tool reports. File contents never go to the browser: a read is a line count. */
function outputOf(part: OpenCodeToolPart) {
  const { state, tool } = part;
  if (state.status === "error") {
    return relative(state.error);
  }
  if (state.status !== "completed") {
    return undefined;
  }
  if (tool === "read") {
    return `Read ${state.output.split("\n").length} lines`;
  }
  if (EDIT_TOOLS.has(tool)) {
    return undefined;
  }
  return relative(state.output);
}

function todosOf(input: Record<string, unknown>): TranscriptPart | null {
  if (!Array.isArray(input.todos)) {
    return null;
  }
  const items = input.todos.flatMap((todo): TodoItem[] => {
    const { content, status } = (todo ?? {}) as Record<string, unknown>;
    return typeof content === "string"
      ? [
          {
            content,
            status: (TODO_STATUSES.includes(status as string)
              ? status
              : "pending") as TodoStatus,
          },
        ]
      : [];
  });
  return { id: TODOS_PART_ID, type: "todos", items };
}

const titleOf = (state: OpenCodeToolPart["state"]) =>
  "title" in state && state.title ? relative(state.title) : undefined;

function mapTool(part: OpenCodeToolPart): TranscriptPart | null {
  const { state, tool } = part;
  if (tool === "todowrite") {
    return todosOf(state.input);
  }
  const finished = state.status === "completed" || state.status === "error";
  return {
    id: part.id,
    type: "tool",
    tool,
    status: state.status,
    title: titleOf(state),
    input: summarizeInput(tool, state.input),
    output: outputOf(part),
    diff:
      state.status === "completed"
        ? diffOf(tool, state.input, state.metadata)
        : undefined,
    startedAt: "time" in state ? state.time.start : undefined,
    endedAt: finished && "time" in state ? state.time.end : undefined,
  };
}

/** Converts one part of the coding agent's message, or null for parts users never see. */
export function mapOpenCodePart(part: Part): TranscriptPart | null {
  switch (part.type) {
    case "text":
      return part.synthetic || part.ignored
        ? null
        : { id: part.id, type: "text", text: part.text };
    case "reasoning":
      return {
        id: part.id,
        type: "reasoning",
        text: part.text,
        startedAt: part.time.start,
        endedAt: part.time.end,
      };
    case "tool":
      return mapTool(part);
    case "retry":
      return {
        id: part.id,
        type: "notice",
        level: "warning",
        text: `The model didn't respond; retrying (attempt ${part.attempt}).`,
      };
    default:
      return null;
  }
}
