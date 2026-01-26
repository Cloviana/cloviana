import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import pRetry from "p-retry";
import { z } from "zod";

type Message = OpenAI.ChatCompletionMessageParam;

export class OpenAIClient {
  private readonly openai: OpenAI;

  constructor(openai?: OpenAI) {
    this.openai = openai ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async chatJson<T>({
    name,
    schema,
    messages,
    model = "gpt-5.1",
    retries = 3,
    reasoningEffort,
  }: {
    name: string;
    schema: z.ZodTypeAny;
    messages: Message[];
    model?: string;
    temperature?: number;
    retries?: number;
    reasoningEffort?: "minimal" | "low" | "medium" | "high" | "default";
  }): Promise<T> {
    const run = async () => {
      const completion = await this.openai.chat.completions.parse({
        model,
        messages,
        reasoning_effort:
          reasoningEffort === "default" ? undefined : reasoningEffort,
        response_format: zodResponseFormat(schema, name),
      });
      console.log(completion);
      const content = completion.choices[0].message.parsed;
      console.log(content);
      const result = schema.safeParse(content);

      if (!result.success) {
        throw new Error(
          `[${name}] Response failed schema validation: ${result.error.message}`,
        );
      }

      return result.data as T;
    };

    return pRetry(run, {
      retries,
      minTimeout: 10000,
      maxTimeout: 60000,
      factor: 2,
    });
  }

  async chat({
    messages,
    model = "gpt-5.1",
    retries = 3,
    reasoningEffort,
  }: {
    messages: Message[];
    model?: string;
    temperature?: number;
    retries?: number;
    reasoningEffort?: "minimal" | "low" | "medium" | "high" | "default";
  }): Promise<string> {
    const run = async () => {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        reasoning_effort:
          reasoningEffort === "default" ? undefined : reasoningEffort,
      });

      return completion.choices?.[0]?.message?.content ?? "";
    };

    return pRetry(run, {
      retries,
      minTimeout: 10000,
      maxTimeout: 60000,
      factor: 2,
    });
  }
}
