import Groq from "groq-sdk";
import { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions.mjs";
import pRetry from "p-retry";
import { z } from "zod";

type Message = NonNullable<ChatCompletionCreateParams["messages"]>[number];

export class GroqClient {
  private readonly groq: Groq;
  constructor(groq?: Groq) {
    this.groq = groq ?? new Groq();
  }

  /**
   * JSON-schema enforced chat completion with retry and validation.
   * Accepts Zod schemas to guarantee structured outputs.
   */
  async chatJson<T>({
    name,
    schema,
    messages,
    model = "openai/gpt-oss-120b",
    temperature = 0.2,
    retries = 3,
    reasoningEffort,
  }: {
    name: string;
    schema: z.ZodTypeAny;
    messages: Message[];
    model?: "moonshotai/kimi-k2-instruct-0905" | "openai/gpt-oss-20b" | "openai/gpt-oss-120b";
    temperature?: number;
    retries?: number;
    reasoningEffort?: "low" | "medium" | "high" | "default" | "none";
  }): Promise<T> {
    const run = async () => {
      const completion = await this.groq.chat.completions.create({
        model,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name,
            schema: z.toJSONSchema(schema)
          }
        },
        temperature,
        reasoning_effort: reasoningEffort,
      });

      const content = completion.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const result = schema.safeParse(parsed);

      if (!result.success) {
        throw new Error(
          `[${name}] Response failed schema validation: ${result.error.message}`
        );
      }

      return result.data as T;
    };

    return pRetry(run, { retries, minTimeout: 10000, maxTimeout: 60000, factor: 2 });
  }

  async chat({
    messages,
    model = "openai/gpt-oss-20b",
    temperature = 0.2,
    retries = 3,
    reasoningEffort,
  }: {
    messages: Message[];
    model?: string;
    temperature?: number;
    retries?: number;
    reasoningEffort?: "low" | "medium" | "high" | "default" | "none";
  }): Promise<string> {
    const run = async () => {
      const completion = await this.groq.chat.completions.create({
        model,
        messages,
        temperature,
        reasoning_effort: reasoningEffort,
      });

      return completion.choices?.[0]?.message?.content ?? "";
    };

    return pRetry(run, { retries, minTimeout: 10000, maxTimeout: 60000, factor: 2 });
  }
}
