import { isAIMessage, isToolMessage } from "@langchain/core/messages";
import type { ToolPart } from "../../domain/transcript";

const textOf = (content: unknown) =>
  typeof content === "string" ? content : JSON.stringify(content);

/**
 * Follows the assistant's tool use through a LangGraph run. A call is announced when the model
 * asks for it and finished when the tool's result comes back, possibly updates later, so the
 * tracker remembers what each call was.
 */
export class ToolCallTracker {
  private readonly calls = new Map<string, { tool: string; input: string }>();

  /** The tool parts a graph update starts or finishes. */
  observe(update: unknown): ToolPart[] {
    const parts: ToolPart[] = [];
    for (const node of Object.values(update ?? {})) {
      const messages = (node as { messages?: unknown } | null)?.messages;
      if (!Array.isArray(messages)) {
        continue;
      }
      for (const message of messages) {
        if (isAIMessage(message)) {
          for (const call of message.tool_calls ?? []) {
            if (!call.id) {
              continue;
            }
            const input = JSON.stringify(call.args ?? {});
            this.calls.set(call.id, { tool: call.name, input });
            parts.push({
              id: call.id,
              type: "tool",
              tool: call.name,
              status: "running",
              input,
            });
          }
        } else if (isToolMessage(message)) {
          const call = this.calls.get(message.tool_call_id);
          parts.push({
            id: message.tool_call_id,
            type: "tool",
            tool: call?.tool ?? message.name ?? "tool",
            status: message.status === "error" ? "error" : "completed",
            input: call?.input,
            output: textOf(message.content),
          });
        }
      }
    }
    return parts;
  }
}
