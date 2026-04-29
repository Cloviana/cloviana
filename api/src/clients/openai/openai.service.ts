import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError,
} from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessage,
} from "openai/resources/chat/completions";
import type {
  Response as OpenAIResponse,
  ResponseCreateParamsNonStreaming,
  ResponseOutputItem,
} from "openai/resources/responses/responses";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpenAIRawResult = {
  content: string;
  citations: string[];
  raw: ChatCompletion;
};

export type OpenAIParseResult<TSchema extends z.ZodTypeAny> = {
  content: string;
  citations: string[];
  parsed: z.infer<TSchema>;
  raw: OpenAIResponse;
};

export type OpenAIResponseResult = {
  content: string;
  citations: string[];
  raw: OpenAIResponse;
};

type ChatArgs = ChatCompletionCreateParamsNonStreaming & { retries?: number };

type ParseArgs<TSchema extends z.ZodTypeAny> = Omit<
  ResponseCreateParamsNonStreaming,
  "text"
> & { name: string; schema: TSchema; retries?: number };

type ResponseArgs = ResponseCreateParamsNonStreaming & {
  name?: string;
  retries?: number;
};

type BatchRequest = {
  custom_id: string;
  body: ChatCompletionCreateParamsNonStreaming;
};

type ResponsesBatchRequest = {
  custom_id: string;
  body: ResponseCreateParamsNonStreaming;
};

export type BatchResult = {
  custom_id: string;
  content: string | null;
  citations: string[];
  error: string | null;
};

export type ResponsesBatchResult = {
  custom_id: string;
  content: string | null;
  citations: string[];
  error: string | null;
  raw: OpenAIResponse | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const backoffDelay = (
  attempt: number,
  baseMs = 1_000,
  maxMs = 60_000,
): number => {
  const cap = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  return cap + Math.random() * cap;
};

const isTransientError = (error: unknown): boolean =>
  error instanceof RateLimitError ||
  error instanceof InternalServerError ||
  error instanceof APIConnectionError ||
  error instanceof APIConnectionTimeoutError;

async function withRetries<T>(
  fn: () => Promise<T>,
  name: string,
  retries = 3,
): Promise<T> {
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const transient = isTransientError(error);
      const delay = transient ? backoffDelay(attempt) : 0;

      console.warn(
        `[${name}] Attempt ${attempt}/${maxAttempts} failed.`,
        transient
          ? `Transient error — retrying in ${Math.round(delay)}ms.`
          : "Retrying immediately.",
        (error as Error)?.message ?? error,
      );

      if (delay > 0) await sleep(delay);
    }
  }

  throw new Error(`[${name}] withRetries exhausted unexpectedly`);
}

// ─── Citation Extractors ──────────────────────────────────────────────────────

/**
 * Chat Completions API citations.
 *
 * Citations are only present when the `web_search_preview` tool is enabled.
 * They live at `message.annotations[]` with shape:
 *   { type: "url_citation", url_citation: { url, title, start_index, end_index } }
 */
const extractCompletionCitations = (message: ChatCompletionMessage): string[] =>
  (message.annotations ?? [])
    .map((annotation) => {
      if (annotation.type === "url_citation")
        return annotation.url_citation.url;
      return "";
    })
    .filter(Boolean);

/**
 * Responses API citations.
 *
 * Citations live inside output items of type "message", inside content blocks
 * of type "output_text", in the `annotations` array. Two relevant types:
 *
 *   url_citation    → { url, title, start_index, end_index }
 *                     Produced by the web_search_preview tool.
 *
 *   file_citation   → { file_id, filename, index }
 *                     Produced by the file_search tool.
 *
 * Note: plain Responses API calls without tools return no annotations.
 */
const extractResponseCitations = (output: ResponseOutputItem[]): string[] =>
  output
    .filter(
      (item): item is Extract<ResponseOutputItem, { type: "message" }> =>
        item.type === "message",
    )
    .flatMap((item) => item.content)
    .filter(
      (block): block is Extract<typeof block, { type: "output_text" }> =>
        block.type === "output_text",
    )
    .flatMap((block) => block.annotations ?? [])
    .map((annotation) => {
      switch (annotation.type) {
        case "url_citation":
          return annotation.url;
        case "file_citation":
          return annotation.filename ?? annotation.file_id;
        default:
          return "";
      }
    })
    .filter(Boolean);

const extractResponseText = (output: ResponseOutputItem[]): string =>
  output
    .filter(
      (item): item is Extract<ResponseOutputItem, { type: "message" }> =>
        item.type === "message",
    )
    .flatMap((item) => item.content)
    .filter(
      (block): block is Extract<typeof block, { type: "output_text" }> =>
        block.type === "output_text",
    )
    .map((block) => block.text)
    .join("\n");

// ─── Service ──────────────────────────────────────────────────────────────────

const TERMINAL_BATCH_STATUSES = new Set([
  "completed",
  "failed",
  "expired",
  "cancelled",
]);

@Injectable()
export class OpenAIService {
  private readonly client: OpenAI;

  constructor(private readonly config: AppConfiguration) {
    this.client = new OpenAI({ apiKey: this.config.openaiApiKey });
  }

  /**
   * Chat Completions wrapper.
   * Enable web search by passing `tools: [{ type: "web_search_preview" }]`
   * in the request — citations will be populated automatically.
   */
  async create({
    retries = 3,
    ...request
  }: ChatArgs): Promise<OpenAIRawResult> {
    return withRetries(
      async () => {
        const raw = await this.client.chat.completions.create(request);
        const message = raw.choices[0]?.message;
        return {
          content: message?.content ?? "",
          citations: message ? extractCompletionCitations(message) : [],
          raw,
        };
      },
      "openai-chat",
      retries,
    );
  }

  /**
   * Responses API structured-output wrapper.
   * Returns the parsed schema output alongside content, citations, and the raw
   * response so callers aren't forced to discard grounding metadata.
   *
   * Enable web search:  tools: [{ type: "web_search_preview" }]
   * Enable file search: tools: [{ type: "file_search", vector_store_ids: [...] }]
   */
  async parse<TSchema extends z.ZodTypeAny>({
    name,
    schema,
    retries = 3,
    ...request
  }: ParseArgs<TSchema>): Promise<OpenAIParseResult<TSchema>> {
    return withRetries(
      async () => {
        const raw = await this.client.responses.parse({
          ...request,
          text: { format: zodTextFormat(schema, name) },
        });

        if (!raw.output_parsed) {
          throw new Error(`[${name}] Response missing parsed output`);
        }

        return {
          content: extractResponseText(raw.output),
          citations: extractResponseCitations(raw.output),
          parsed: raw.output_parsed,
          raw,
        };
      },
      name,
      retries,
    );
  }

  async responsesCreate({
    name = "openai-response",
    retries = 3,
    ...request
  }: ResponseArgs): Promise<OpenAIResponseResult> {
    return withRetries(
      async () => {
        const raw = await this.client.responses.create(request);

        return {
          content: extractResponseText(raw.output),
          citations: extractResponseCitations(raw.output),
          raw,
        };
      },
      name,
      retries,
    );
  }

  async embed(
    input: string[],
    {
      model = "text-embedding-3-small",
      retries = 3,
    }: { model?: string; retries?: number } = {},
  ): Promise<number[][]> {
    return withRetries(
      async () => {
        const response = await this.client.embeddings.create({ model, input });
        return response.data
          .sort((a, b) => a.index - b.index)
          .map((item) => item.embedding);
      },
      "openai-embed",
      retries,
    );
  }

  /**
   * Batch wrapper for Chat Completions.
   * If the individual requests include `tools: [{ type: "web_search_preview" }]`,
   * citations will be extracted per result.
   */
  async batch(
    requests: BatchRequest[],
    pollIntervalMs = 10_000,
  ): Promise<BatchResult[]> {
    const file = await this.uploadChatBatchFile(requests);

    const batch = await this.client.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
    });

    const completed = await this.pollUntilTerminal(batch.id, pollIntervalMs);

    if (completed.status !== "completed" || !completed.output_file_id) {
      throw new Error(
        `[openai-batch] Batch ended with status: ${completed.status}`,
      );
    }

    return this.parseBatchOutput(completed.output_file_id);
  }

  async responsesBatch(
    requests: ResponsesBatchRequest[],
    pollIntervalMs = 10_000,
  ): Promise<ResponsesBatchResult[]> {
    const file = await this.uploadResponsesBatchFile(requests);

    const batch = await this.client.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/responses",
      completion_window: "24h",
    });

    const completed = await this.pollUntilTerminal(batch.id, pollIntervalMs);

    if (completed.status !== "completed" || !completed.output_file_id) {
      throw new Error(
        `[openai-responses-batch] Batch ended with status: ${completed.status}`,
      );
    }

    return this.parseResponsesBatchOutput(completed.output_file_id);
  }

  private async uploadChatBatchFile(requests: BatchRequest[]) {
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

  private async uploadResponsesBatchFile(requests: ResponsesBatchRequest[]) {
    const jsonl = requests
      .map((r) =>
        JSON.stringify({
          custom_id: r.custom_id,
          method: "POST",
          url: "/v1/responses",
          body: r.body,
        }),
      )
      .join("\n");

    return this.client.files.create({
      file: new File([jsonl], "responses-batch.jsonl", {
        type: "application/jsonl",
      }),
      purpose: "batch",
    });
  }

  private async pollUntilTerminal(batchId: string, intervalMs: number) {
    let current = await this.client.batches.retrieve(batchId);

    while (!TERMINAL_BATCH_STATUSES.has(current.status)) {
      await sleep(intervalMs);
      current = await this.client.batches.retrieve(batchId);
      //console.log(`[openai-batch] ${batchId} — ${current.status}`);
    }

    return current;
  }

  private async parseBatchOutput(outputFileId: string): Promise<BatchResult[]> {
    const fileContent = await this.client.files.content(outputFileId);
    const text = await fileContent.text();

    return text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const row = JSON.parse(line);
        const message: ChatCompletionMessage | undefined =
          row.response?.body?.choices?.[0]?.message;
        return {
          custom_id: row.custom_id,
          content: message?.content ?? null,
          citations: message ? extractCompletionCitations(message) : [],
          error: row.error?.message ?? null,
        };
      });
  }

  private async parseResponsesBatchOutput(
    outputFileId: string,
  ): Promise<ResponsesBatchResult[]> {
    const fileContent = await this.client.files.content(outputFileId);
    const text = await fileContent.text();

    return text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const row = JSON.parse(line);
        const raw: OpenAIResponse | null = row.response?.body ?? null;

        return {
          custom_id: row.custom_id,
          content: raw ? extractResponseText(raw.output) : null,
          citations: raw ? extractResponseCitations(raw.output) : [],
          error: row.error?.message ?? null,
          raw,
        };
      });
  }
}
