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

type GroqBatchRequest = {
  custom_id: string;
  body: ChatCompletionCreateParamsNonStreaming;
};

export type GroqBatchResult = {
  custom_id: string;
  content: string | null;
  citations: string[];
  error: string | null;
  raw: ChatCompletion | null;
};

const TERMINAL_BATCH_STATUSES = new Set([
  "completed",
  "failed",
  "expired",
  "cancelled",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backoffDelay = (attempt: number, baseMs = 1000, maxMs = 60000) => {
  const exp = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  return exp + Math.random() * exp;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function withRetries<T>(
  fn: () => Promise<T>,
  { name, retries = 3 }: { name: string; retries?: number },
): Promise<T> {
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (attempt === maxAttempts) {
        throw error;
      }

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
        } Error: ${getErrorMessage(error)}`,
      );

      if (delay > 0) {
        await sleep(delay);
      }
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
          let completion: ChatCompletion;
          try {
            completion = await this.client.chat.completions.create({
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
          } catch (error: unknown) {
            const errorMessage = getErrorMessage(error);
            const errorCode =
              typeof error === "object" && error !== null && "code" in error
                ? error.code
                : undefined;
            const isJsonSchemaUnsupported =
              errorMessage.includes("does not support response format") ||
              errorMessage.includes("json_schema") ||
              errorMessage.includes("Failed to validate JSON") ||
              errorCode === "json_validate_failed";

            if (isJsonSchemaUnsupported) {
              console.warn(
                `[GroqService] Model ${request.model} failed with json_schema. Falling back to json_object.`,
              );
              completion = await this.client.chat.completions.create({
                ...request,
                response_format: {
                  type: "json_object",
                },
              });
            } else {
              throw error;
            }
          }

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

  async batch(
    requests: GroqBatchRequest[],
    pollIntervalMs = 10_000,
  ): Promise<GroqBatchResult[]> {
    const file = await this.uploadBatchFile(requests);

    if (!file.id) {
      throw new Error("[groq-batch] File upload did not return an ID");
    }

    const batch = await this.client.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
    });

    const completed = await this.pollUntilTerminal(batch.id, pollIntervalMs);

    if (completed.status !== "completed" || !completed.output_file_id) {
      throw new Error(
        `[groq-batch] Batch ended with status: ${completed.status}`,
      );
    }

    return this.parseBatchOutput(completed.output_file_id);
  }

  private async uploadBatchFile(requests: GroqBatchRequest[]) {
    const jsonl = requests
      .map((r) =>
        JSON.stringify({
          custom_id: r.custom_id,
          method: "POST",
          url: "/v1/chat/completions",
          body: r.body,
        }),
      )
      .join("\n");

    return this.client.files.create({
      file: new File([jsonl], "batch.jsonl", { type: "application/jsonl" }),
      purpose: "batch",
    });
  }

  private async pollUntilTerminal(batchId: string, intervalMs: number) {
    let current = await this.client.batches.retrieve(batchId);

    while (!TERMINAL_BATCH_STATUSES.has(current.status)) {
      await sleep(intervalMs);
      current = await this.client.batches.retrieve(batchId);
    }

    return current;
  }

  private async parseBatchOutput(
    outputFileId: string,
  ): Promise<GroqBatchResult[]> {
    const fileContent = await this.client.files.content(outputFileId);
    const text = await fileContent.text();

    return text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const row = JSON.parse(line);
        const raw: ChatCompletion | null = row.response?.body ?? null;

        return {
          custom_id: row.custom_id,
          content: raw?.choices?.[0]?.message?.content ?? null,
          citations: [],
          error: row.error?.message ?? null,
          raw,
        };
      });
  }
}
