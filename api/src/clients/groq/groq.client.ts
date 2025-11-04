import Groq from "groq-sdk";
import { ChatCompletionCreateParams } from "groq-sdk/resources/chat/completions.mjs";
import pRetry from "p-retry";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

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
    model = "openai/gpt-oss-20b",
    temperature = 0.2,
    retries = 3,
  }: {
    name: string;
    schema: z.ZodTypeAny;
    messages: Message[];
    model?: string;
    temperature?: number;
    retries?: number;
  }): Promise<T> {
    const jsonSchema = zodToJsonSchema(schema, name);

    const run = async () => {
      const completion = await this.groq.chat.completions.create({
        model,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name, schema: jsonSchema },
        },
        temperature,
      });

      const content = completion.choices?.[0]?.message?.content ?? "{}";
      return JSON.parse(content) as T;
    };

    return pRetry(run, { retries });
  }
}
