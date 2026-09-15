import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import pLimit from "p-limit";
import { z } from "zod";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

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

export type OpenRouterChatArgs = ChatCompletionCreateParamsNonStreaming & {
  provider?: OpenRouterProviderPreferences;
  retries?: number;
};

export type OpenRouterRawResult = {
  content: string;
  citations: string[];
  raw: ChatCompletion;
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
  private client: OpenAI | null = null;
  private readonly limit = pLimit(5);

  async create({
    retries = 3,
    ...request
  }: OpenRouterChatArgs): Promise<OpenRouterRawResult> {
    return this.limit(async () => {
      const raw = await this.getClient().chat.completions.create(request, {
        maxRetries: retries,
      });

      return {
        content: raw.choices[0]?.message?.content ?? "",
        citations: [],
        raw,
      };
    });
  }

  async parse<TSchema extends z.ZodTypeAny>({
    name,
    schema,
    retries = 3,
    provider,
    ...request
  }: OpenRouterParseArgs<TSchema>): Promise<z.infer<TSchema>> {
    return this.limit(async () => {
      const completionRequest: ChatCompletionCreateParamsNonStreaming & {
        provider: OpenRouterProviderPreferences;
      } = {
        ...request,
        provider: {
          ...provider,
          require_parameters: true,
        },
        response_format: {
          type: "json_schema",
          json_schema: {
            name,
            strict: true,
            schema: z.toJSONSchema(schema),
          },
        },
      };
      const completion = await this.getClient().chat.completions.create(
        completionRequest,
        { maxRetries: retries },
      );
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
    });
  }

  private getClient(): OpenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
    });

    return this.client;
  }
}
