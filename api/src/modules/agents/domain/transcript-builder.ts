import {
  type FileDiff,
  TRANSCRIPT_LIMITS as LIMITS,
  type TodoItem,
  type TranscriptPart,
} from "./transcript";

const TRUNCATED = "\n… (truncated)";

function clip(value: string, max: number) {
  return value.length > max
    ? value.slice(0, max - TRUNCATED.length) + TRUNCATED
    : value;
}

function clipDiff(diff: FileDiff): FileDiff {
  return { ...diff, patch: clip(diff.patch, LIMITS.diffPatch) };
}

function clipTodos(items: TodoItem[]) {
  return items.slice(0, LIMITS.todos).map((item) => ({
    ...item,
    content: clip(item.content, LIMITS.todoContent),
  }));
}

/** Enforces the size limits, so nothing the agent produces can be unbounded. */
export function boundPart(part: TranscriptPart): TranscriptPart {
  switch (part.type) {
    case "text":
      return { ...part, text: clip(part.text, LIMITS.text) };
    case "reasoning":
      return { ...part, text: clip(part.text, LIMITS.reasoning) };
    case "tool":
      return {
        ...part,
        title: part.title && clip(part.title, LIMITS.toolTitle),
        input: part.input && clip(part.input, LIMITS.toolInput),
        output: part.output && clip(part.output, LIMITS.toolOutput),
        diff: part.diff && clipDiff(part.diff),
      };
    case "todos":
      return { ...part, items: clipTodos(part.items) };
    case "notice":
      return { ...part, text: clip(part.text, LIMITS.notice) };
  }
}

/**
 * Collects a run's parts in the order they first appeared. The engine feeds it, emits what it
 * returns, and saves `parts()` with the assistant message when the run ends.
 */
export class TranscriptBuilder {
  private readonly order: string[] = [];
  private readonly byId = new Map<string, TranscriptPart>();

  /** Adds a part or replaces one with the same id. Returns the bounded part to publish. */
  upsert(part: TranscriptPart): TranscriptPart {
    const bounded = boundPart(part);
    if (!this.byId.has(bounded.id)) {
      if (this.order.length >= LIMITS.parts) {
        return bounded;
      }
      this.order.push(bounded.id);
    }
    this.byId.set(bounded.id, bounded);
    return bounded;
  }

  /** Appends streamed text to a text or reasoning part. Returns what was actually added. */
  append(id: string, text: string): string {
    const part = this.byId.get(id);
    if (part?.type !== "text" && part?.type !== "reasoning") {
      return "";
    }
    const max = part.type === "text" ? LIMITS.text : LIMITS.reasoning;
    const room = max - part.text.length;
    if (room <= 0) {
      return "";
    }
    const added = text.slice(0, room);
    this.byId.set(id, { ...part, text: part.text + added });
    return added;
  }

  get(id: string) {
    return this.byId.get(id);
  }

  parts(): TranscriptPart[] {
    return this.order.flatMap((id) => {
      const part = this.byId.get(id);
      return part ? [part] : [];
    });
  }

  /** The assistant's written answer: the text parts joined, which later turns use as context. */
  text() {
    return this.parts()
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n\n");
  }
}
