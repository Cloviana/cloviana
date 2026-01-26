import Anthropic from "@anthropic-ai/sdk";
import pRetry from "p-retry";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class ClaudeClient {
  private readonly client: Anthropic;

  constructor(client?: Anthropic) {
    this.client = client ?? new Anthropic();
  }

  private splitSystem(messages: Message[]) {
    const systemParts: string[] = [];
    const chatMessages: Array<{ role: "user" | "assistant"; content: string }> =
      [];

    for (const m of messages) {
      if (m.role === "system") systemParts.push(m.content);
      else chatMessages.push({ role: m.role, content: m.content });
    }

    return {
      system: systemParts.length ? systemParts.join("\n\n") : undefined,
      messages: chatMessages,
    };
  }

  private extractText(message: any): string {
    const blocks = message?.content ?? [];
    if (typeof blocks === "string") return blocks;
    if (!Array.isArray(blocks)) return "";

    return blocks
      .map((b) => (typeof b?.text === "string" ? b.text : ""))
      .join("");
  }

  async chat({
    messages,
    model = "claude-sonnet-4-5",
    temperature = 0.2,
    maxTokens = 4096,
    retries = 3,
    reasoningEffort,
  }: {
    messages: Message[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    retries?: number;
    reasoningEffort?: "low" | "medium" | "high" | "default" | "none";
  }): Promise<string> {
    const run = async () => {
      const { system, messages: chatMessages } = this.splitSystem(messages);

      const completion = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: chatMessages,
        temperature,
        effort: reasoningEffort,
      } as any);

      return this.extractText(completion);
    };

    return pRetry(run, {
      retries,
      minTimeout: 10000,
      maxTimeout: 60000,
      factor: 2,
    });
  }

  async chatJson<T>({
    name,
    schema,
    messages,
    model = "claude-sonnet-4-5-20250929",
    temperature = 0.2,
    maxTokens = 2048,
    retries = 3,
    reasoningEffort,
  }: {
    name: string;
    schema: z.ZodTypeAny;
    messages: Message[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    retries?: number;
    reasoningEffort?: "low" | "medium" | "high" | "default" | "none";
  }): Promise<T> {
    const jsonSchema = zodToJsonSchema(schema, name);

    const run = async () => {
      const { system, messages: chatMessages } = this.splitSystem(messages);

      const completion = await this.client.beta.messages.create({
        model,
        max_tokens: maxTokens,
        betas: ["structured-outputs-2025-11-13"],
        system,
        messages: chatMessages,
        temperature,
        output_format: {
          type: "json_schema",
          schema: jsonSchema,
        },
        ...(reasoningEffort &&
        reasoningEffort !== "default" &&
        reasoningEffort !== "none" &&
        model.includes("opus-4-5")
          ? { effort: reasoningEffort }
          : {}),
      } as any);

      const text = this.extractText(completion);
      const parsed = JSON.parse(text);
      return schema.parse(parsed) as T;
    };

    return pRetry(run, {
      retries,
      minTimeout: 10000,
      maxTimeout: 60000,
      factor: 2,
    });
  }
}
