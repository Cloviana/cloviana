import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import Perplexity, {
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError,
} from "@perplexity-ai/perplexity_ai";
import type { StreamChunk } from "@perplexity-ai/perplexity_ai/resources/chat/chat";
import type { CompletionCreateParamsNonStreaming } from "@perplexity-ai/perplexity_ai/resources/chat/completions";
import type { ChatMessageOutput } from "@perplexity-ai/perplexity_ai/resources/shared";

type PerplexityChatArgs = CompletionCreateParamsNonStreaming & {
  retries?: number;
};

export type PerplexityRawResult = {
  content: string;
  citations: string[];
  raw: StreamChunk;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backoffDelay = (attempt: number, baseMs = 1000, maxMs = 60000) => {
  const exp = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  return exp + Math.random() * exp;
};

const extractTextContent = (content: ChatMessageOutput["content"]): string => {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter(
      (chunk): chunk is ChatMessageOutput.ChatMessageContentTextChunk =>
        chunk.type === "text",
    )
    .map((chunk) => chunk.text)
    .join("\n");
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

      const delay = transient ? backoffDelay(attempt) : 0;

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
export class PerplexityService {
  private readonly client: Perplexity;

  constructor(private readonly config: AppConfiguration) {
    this.client = new Perplexity({ apiKey: this.config.perplexityApiKey });
  }

  async create({
    retries = 3,
    ...request
  }: PerplexityChatArgs): Promise<PerplexityRawResult> {
    return withRetries(
      async () => {
        const completion = await this.client.chat.completions.create(request);

        return {
          content: extractTextContent(
            completion.choices[0]?.message?.content ?? null,
          ),
          citations: completion.citations ?? [],
          raw: completion,
        };
      },
      { name: "perplexity-chat", retries },
    );
  }
}
