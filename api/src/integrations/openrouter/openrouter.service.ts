import { AppConfiguration } from "@/platform/config/app.configuration";
import { Injectable } from "@nestjs/common";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";
import { z } from "zod";

export type OpenRouterProviderPreferences = {
  allow_fallbacks?: boolean;
  data_collection?: "allow" | "deny";
  ignore?: string[];
  max_price?: {
    completion?: number;
    image?: number;
    prompt?: number;
    request?: number;
  };
  only?: string[];
  order?: string[];
  require_parameters?: boolean;
  sort?: "price" | "throughput" | "latency";
  zdr?: boolean;
};

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | Array<Record<string, unknown>> | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<Record<string, unknown>>;
};

export type OpenRouterChatArgs = {
  model?: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  tools?: Array<Record<string, unknown>>;
  tool_choice?: string | Record<string, unknown>;
  response_format?: {
    type: "json_object" | "json_schema";
    json_schema?: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
  };
  provider?: OpenRouterProviderPreferences;
  retries?: number;
};

export type OpenRouterCompletion = {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type OpenRouterRawResult = {
  content: string;
  citations: string[];
  raw: OpenRouterCompletion;
};

export type OpenRouterParseArgs<TSchema extends z.ZodTypeAny> = Omit<
  OpenRouterChatArgs,
  "response_format"
> & {
  name: string;
  schema: TSchema;
};

@Injectable()
export class OpenRouterService {
  private readonly limit = pLimit(5);

  constructor(private readonly config: AppConfiguration) {}

  async create({
    retries = 3,
    ...request
  }: OpenRouterChatArgs): Promise<OpenRouterRawResult> {
    if (!this.config.openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    return this.limit(async () => {
      const raw = await pRetry(
        async () => {
          const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.config.openrouterApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ...request, stream: false }),
              signal: AbortSignal.timeout(120_000),
            },
          );

          if (!response.ok) {
            const message = `OpenRouter request failed (${response.status})`;
            if (
              response.status < 500 &&
              ![408, 429].includes(response.status)
            ) {
              throw new AbortError(message);
            }
            throw new Error(message);
          }

          const completion = (await response.json()) as OpenRouterCompletion & {
            error?: { message?: string };
          };
          if (completion.error || !Array.isArray(completion.choices)) {
            throw new AbortError(
              completion.error?.message ?? "Invalid OpenRouter response",
            );
          }
          return completion;
        },
        { retries },
      );

      const content = raw.choices[0]?.message.content;
      return {
        content: typeof content === "string" ? content : "",
        citations: [],
        raw,
      };
    });
  }

  async parse<TSchema extends z.ZodTypeAny>({
    name,
    schema,
    provider,
    ...request
  }: OpenRouterParseArgs<TSchema>): Promise<z.infer<TSchema>> {
    const { content } = await this.create({
      ...request,
      provider: { ...provider, require_parameters: true },
      response_format: {
        type: "json_schema",
        json_schema: { name, strict: true, schema: z.toJSONSchema(schema) },
      },
    });

    if (!content) {
      throw new Error(`[${name}] Response did not contain content`);
    }
    return schema.parse(JSON.parse(content));
  }
}
