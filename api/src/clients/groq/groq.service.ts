import { providerRetryDelayMs } from "@/common/utils/retry-delay.util";
import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import Groq, {
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError,
} from "groq-sdk";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "groq-sdk/resources/chat/completions";
import pLimit from "p-limit";
import { z } from "zod";

type GroqChatArgs = ChatCompletionCreateParamsNonStreaming & {
  retries?: number;
};

export type GroqRawResult = {
  content: string;
  citations: string[];
  raw: ChatCompletion;
};

type GroqParseArgs<TSchema extends z.ZodTypeAny> = Omit<
  ChatCompletionCreateParamsNonStreaming,
  "response_format"
> & {
  name: string;
  schema: TSchema;
  retries?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backoffDelay = (attempt: number, baseMs = 1000, maxMs = 60000) => {
  const exp = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  return exp + Math.random() * exp;
};

async function withRetries<T>(
  fn: () => Promise<T>,
  { name, retries = 3 }: { name: string; retries?: number },
): Promise<T> {
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxAttempts) throw error;

      const transient =
        error instanceof RateLimitError ||
        error instanceof InternalServerError ||
        error instanceof APIConnectionError ||
        error instanceof APIConnectionTimeoutError;

      const providerDelay = transient
        ? providerRetryDelayMs(error, [
            "retry-after",
            "x-ratelimit-reset-tokens",
          ])
        : null;
      const delay = transient ? (providerDelay ?? backoffDelay(attempt)) : 0;

      console.warn(
        `[${name}] Attempt ${attempt} failed. Retries left: ${maxAttempts - attempt}. ${
          transient
            ? `Rate-limit/network suspected, waiting ${Math.round(delay)}ms.`
            : "Retrying immediately."
        } Error: ${error?.message ?? error}`,
      );

      if (delay > 0) await sleep(delay);
    }
  }

  throw new Error(`[${name}] withRetries exhausted unexpectedly`);
}

@Injectable()
export class GroqService {
  private readonly client: Groq;
  private readonly limit = pLimit(5);

  constructor(private readonly config: AppConfiguration) {
    this.client = new Groq({ apiKey: this.config.groqApiKey });
  }

  async create({
    retries = 3,
    ...request
  }: GroqChatArgs): Promise<GroqRawResult> {
    return this.limit(() =>
      withRetries(
        async () => {
          const completion = await this.client.chat.completions.create(request);

          return {
            content: completion.choices[0]?.message?.content ?? "",
            citations: [],
            raw: completion,
          };
        },
        { name: "groq-chat", retries },
      ),
    );
  }

  async parse<TSchema extends z.ZodTypeAny>({
    name,
    schema,
    retries = 3,
    ...request
  }: GroqParseArgs<TSchema>): Promise<z.infer<TSchema>> {
    return this.limit(() =>
      withRetries(
        async () => {
          const completion = await this.client.chat.completions.create({
            ...request,
            response_format: {
              type: "json_schema",
              json_schema: {
                name,
                strict: true,
                schema: z.toJSONSchema(schema),
              },
            },
          });

          const content = completion.choices[0]?.message?.content;

          if (!content) {
            throw new Error(`[${name}] Response did not contain content`);
          }

          const result = schema.safeParse(JSON.parse(content));

          if (!result.success) {
            throw new Error(
              `[${name}] Response failed schema validation: ${result.error.message}`,
            );
          }

          return result.data;
        },
        { name, retries },
      ),
    );
  }
}
