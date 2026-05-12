import { providerRetryDelayMs } from "@/common/utils/retry-delay.util";
import { AppConfiguration } from "@/config/app.configuration";
import Anthropic, {
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  BetaMessage,
  MessageCreateParamsNonStreaming as BetaMessageCreateParamsNonStreaming,
  BetaTextBlock,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type {
  Message,
  MessageCreateParamsNonStreaming,
  TextBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { Injectable } from "@nestjs/common";
import pLimit from "p-limit";
import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnthropicRawResult = {
  content: string;
  citations: string[];
  raw: Message | BetaMessage;
};

type AnthropicChatArgs = MessageCreateParamsNonStreaming & { retries?: number };

type AnthropicParseArgs<TSchema extends z.ZodTypeAny> = Omit<
  MessageCreateParamsNonStreaming,
  "output_config"
> & {
  schema: TSchema;
  retries?: number;
};

type AnthropicBatchRequest = {
  custom_id: string;
  params: BetaMessageCreateParamsNonStreaming;
};

type BatchResult<T = string> = {
  custom_id: string;
  result:
    | { type: "succeeded"; content: T }
    | {
        type: "errored" | "canceled" | "expired";
        error?: unknown;
      };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backoffDelay = (attempt: number, baseMs = 1000, maxMs = 60_000) => {
  const cap = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  return cap + Math.random() * cap;
};

const isTransientError = (err: unknown) =>
  err instanceof RateLimitError ||
  err instanceof InternalServerError ||
  err instanceof APIConnectionError ||
  err instanceof APIConnectionTimeoutError;

const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

function extractText(blocks: (TextBlock | BetaTextBlock)[]): string {
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function extractCitations(blocks: (TextBlock | BetaTextBlock)[]): string[] {
  return blocks
    .filter((b) => b.type === "text")
    .flatMap((b) => b.citations ?? [])
    .map((c) => {
      if (c.type === "web_search_result_location") return c.url;
      if (c.type === "search_result_location") return c.source;
      return "";
    })
    .filter((url) => Boolean(url) && isUrl(url));
}

function toRawResult(message: Message | BetaMessage): AnthropicRawResult {
  const blocks = message.content as (TextBlock | BetaTextBlock)[];
  return {
    content: extractText(blocks),
    citations: extractCitations(blocks),
    raw: message,
  };
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
      if (attempt === maxAttempts) throw error;

      const transient = isTransientError(error);
      const providerDelay = transient
        ? providerRetryDelayMs(error, ["retry-after"])
        : null;
      const delay = transient ? (providerDelay ?? backoffDelay(attempt)) : 0;

      console.warn(
        `[${name}] Attempt ${attempt} failed. Retries left: ${maxAttempts - attempt}.`,
        transient
          ? `Rate-limit/network suspected, waiting ${Math.round(delay)}ms.`
          : "Retrying immediately.",
        `Error: ${(error as Error)?.message ?? error}`,
      );

      if (delay > 0) await sleep(delay);
    }
  }

  throw new Error(`[${name}] withRetries exhausted unexpectedly`);
}

async function pollUntilEnded(
  client: Anthropic,
  batchId: string,
  intervalMs: number,
): Promise<void> {
  while (true) {
    await sleep(intervalMs);
    const { processing_status } =
      await client.beta.messages.batches.retrieve(batchId);
    if (processing_status === "ended") return;
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AnthropicService {
  private readonly client: Anthropic;
  private readonly limit = pLimit(2);

  constructor(private readonly config: AppConfiguration) {
    this.client = new Anthropic({ apiKey: this.config.anthropicApiKey });
  }

  async create({
    retries = 3,
    ...request
  }: AnthropicChatArgs): Promise<AnthropicRawResult> {
    return this.limit(() =>
      withRetries(
        async () => toRawResult(await this.client.messages.create(request)),
        { name: "anthropic-chat", retries },
      ),
    );
  }

  async parse<TSchema extends z.ZodTypeAny>({
    schema,
    retries = 3,
    ...request
  }: AnthropicParseArgs<TSchema>): Promise<z.infer<TSchema>> {
    return this.limit(() =>
      withRetries(
        async () => {
          const response = await this.client.messages.parse({
            ...request,
            output_config: { format: zodOutputFormat(schema) },
          });

          if (!response.parsed_output) {
            throw new Error(
              "[anthropic-parse] Response did not contain parsed output",
            );
          }

          return response.parsed_output;
        },
        { name: "anthropic-parse", retries },
      ),
    );
  }

  async batch(
    requests: AnthropicBatchRequest[],
    pollIntervalMs = 5_000,
  ): Promise<BatchResult<AnthropicRawResult>[]> {
    const batch = await this.client.beta.messages.batches.create({ requests });
    await pollUntilEnded(this.client, batch.id, pollIntervalMs);

    const results: BatchResult<AnthropicRawResult>[] = [];

    for await (const result of await this.client.beta.messages.batches.results(
      batch.id,
    )) {
      results.push(
        result.result.type === "succeeded"
          ? {
              custom_id: result.custom_id,
              result: {
                type: "succeeded",
                content: toRawResult(result.result.message),
              },
            }
          : {
              custom_id: result.custom_id,
              result: {
                type: result.result.type,
                error:
                  "error" in result.result ? result.result.error : undefined,
              },
            },
      );
    }

    return results;
  }
}
