import axios, { AxiosError, AxiosInstance } from "axios";
import { z } from "zod";

type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

type ReasoningEffort = "low" | "medium" | "high" | "default" | "none";

type ChatJsonArgs = {
  name: string;
  schema: z.ZodTypeAny;
  messages: Message[];
  model?:
    | "moonshotai/kimi-k2-instruct-0905"
    | "openai/gpt-oss-20b"
    | "openai/gpt-oss-120b";
  temperature?: number;
  topP?: number;
  retries?: number;
  reasoningEffort?: ReasoningEffort;
};

type ChatArgs = {
  messages: Message[];
  model?: string;
  temperature?: number;
  topP?: number;
  retries?: number;
  reasoningEffort?: ReasoningEffort;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitOrNetworkError = (error: unknown): boolean => {
  const err = error as AxiosError;
  const status = err.response?.status;
  const code = err.code;

  if (status === 429) return true;
  if (status !== undefined && status >= 500) return true;

  const networkCodes = new Set([
    "ECONNRESET",
    "ECONNABORTED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EAI_AGAIN",
  ]);

  if (code && networkCodes.has(code)) return true;

  return false;
};

const backoffDelay = (attempt: number, baseMs = 1000, maxMs = 60000) => {
  const exp = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  const jitter = Math.random() * exp;
  return exp + jitter;
};

async function withRetries<T>(
  fn: () => Promise<T>,
  {
    name,
    retries = 3,
  }: {
    name: string;
    retries?: number;
  },
): Promise<T> {
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLast = attempt === maxAttempts;
      if (isLast) {
        const err = error as AxiosError<any>;
        const status = err.response?.status;
        const data = err.response?.data;

        console.warn(
          `[${name}] Attempt ${attempt} failed. Status: ${status}. Error: ${error?.message ?? error}`,
        );

        if (data) {
          console.warn(
            `[${name}] Response body: ${JSON.stringify(data, null, 2)}`,
          );
        }
        throw error;
      }

      const transient = isRateLimitOrNetworkError(error);
      const delay = transient ? backoffDelay(attempt) : 0;

      console.warn(
        `[${name}] Attempt ${attempt} failed. Retries left: ${
          maxAttempts - attempt
        }. ${
          transient
            ? `Rate-limit/network suspected, waiting ${Math.round(delay)}ms.`
            : "Retrying immediately."
        } Error: ${error?.message ?? error}`,
      );

      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  throw new Error(`[${name}] withRetries exhausted unexpectedly`);
}

export class GroqClient {
  private readonly client: AxiosInstance;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("GROQ_API_KEY is not set");
    }

    this.client = axios.create({
      baseURL: "https://api.groq.com",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
  }

  async chatJson<T>({
    name,
    schema,
    messages,
    model = "openai/gpt-oss-120b",
    temperature = 0.2,
    topP = 1,
    retries = 3,
    reasoningEffort,
  }: ChatJsonArgs): Promise<T> {
    return withRetries(
      async () => {
        const { data } = await this.client.post<any>(
          "/openai/v1/chat/completions",
          {
            model,
            messages,
            response_format: {
              type: "json_schema",
              json_schema: {
                name,
                strict: true,
                schema: z.toJSONSchema(schema),
              },
            },
            temperature,
            top_p: topP,
            reasoning_effort: reasoningEffort,
          },
        );

        const content = data.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const result = schema.safeParse(parsed);

        if (!result.success) {
          throw new Error(
            `[${name}] Response failed schema validation: ${result.error.message}`,
          );
        }

        return result.data as T;
      },
      { name, retries },
    );
  }

  async chat({
    messages,
    model = "openai/gpt-oss-20b",
    temperature = 0.2,
    topP,
    retries = 3,
    reasoningEffort,
  }: ChatArgs): Promise<string> {
    return withRetries(
      async () => {
        const { data } = await this.client.post<any>(
          "/openai/v1/chat/completions",
          {
            model,
            messages,
            temperature,
            top_p: topP,
            reasoning_effort: reasoningEffort,
          },
        );

        return data.choices?.[0]?.message?.content ?? "";
      },
      { name: "chat", retries },
    );
  }

}
