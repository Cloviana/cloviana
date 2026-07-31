import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { extractMentions as extractBrandMentions } from "@/common/visibility/extract-mentions";
import { Injectable, Logger } from "@nestjs/common";
import { AiEngine } from "@prisma/client";
import { z } from "zod";
import type {
  MonitoringCitation,
  MonitoringEngineResponse,
  MonitoringMention,
  MonitoringRunInput,
} from "./monitoring.types";

const FAN_OUT_INFERENCE_MODEL = "openai/gpt-oss-120b";
const MAX_INFERRED_FAN_OUT_QUERIES = 3;
const INFERENCE_ENGINES = new Set<AiEngine>([
  AiEngine.CHATGPT,
  AiEngine.PERPLEXITY,
  AiEngine.AI_OVERVIEWS,
]);
const MIN_EXCERPT_LENGTH = 80;
const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "referrer",
]);
const WEAK_EXCERPT_PATTERNS = [
  /about\s*press\s*copyright\s*contact us/i,
  /enable javascript(?: and cookies)?/i,
  /access denied/i,
  /attention required.*cloudflare/i,
  /checking your browser/i,
  /just a moment/i,
];
const FanOutQueriesSchema = z.object({
  queries: z.array(z.string()).max(MAX_INFERRED_FAN_OUT_QUERIES),
});
const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "prompts",
);

function normalizeComparisonText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function canonicalizeSourceUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";

    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.startsWith("utm_") ||
        TRACKING_PARAMETERS.has(normalizedKey)
      ) {
        url.searchParams.delete(key);
      }
    }

    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return value.trim();
  }
}

function prepareInferenceSources(
  sources: MonitoringCitation[],
): MonitoringCitation[] {
  const uniqueSources = new Map<string, MonitoringCitation>();

  for (const source of sources) {
    const normalizedExcerpt = normalizeComparisonText(source.excerpt);
    const isUseful =
      normalizedExcerpt.length >= MIN_EXCERPT_LENGTH &&
      normalizedExcerpt !== normalizeComparisonText(source.title) &&
      normalizedExcerpt !== normalizeComparisonText(source.url) &&
      !WEAK_EXCERPT_PATTERNS.some((pattern) => pattern.test(normalizedExcerpt));
    if (!isUseful) {
      continue;
    }

    const sourceKey = canonicalizeSourceUrl(source.url);
    const existingSource = uniqueSources.get(sourceKey);
    if (
      !existingSource ||
      source.excerpt.length > existingSource.excerpt.length
    ) {
      uniqueSources.set(sourceKey, source);
    }
  }

  return [...uniqueSources.values()];
}

function deduplicateQueries(queries: string[]): string[] {
  return [
    ...new Map(
      queries
        .map((query) => query.trim())
        .filter(Boolean)
        .map((query) => [query.toLowerCase(), query]),
    ).values(),
  ];
}

function deduplicateMentions(
  mentions: MonitoringMention[],
): MonitoringMention[] {
  return [
    ...new Map(mentions.map((mention) => [mention.domain, mention])).values(),
  ];
}

@Injectable()
export class MonitoringAnalysisService {
  private readonly logger = new Logger(MonitoringAnalysisService.name);

  constructor(private readonly groqService: GroqService) {}

  async enrichResponses(
    input: MonitoringRunInput,
    responses: MonitoringEngineResponse[],
  ): Promise<MonitoringEngineResponse[]> {
    const [mentionsByResponseKey, queriesByResponseKey] = await Promise.all([
      this.extractMentions(input, responses),
      this.inferFanOutQueries(input, responses),
    ]);

    return responses.map((response) => ({
      ...response,
      mentions: deduplicateMentions([
        ...response.mentions,
        ...(mentionsByResponseKey.get(response.responseKey) ?? []),
      ]),
      fanOutQueries: [
        ...response.fanOutQueries,
        ...(queriesByResponseKey.get(response.responseKey) ?? []).map(
          (query) => ({ query, inferred: true }),
        ),
      ],
    }));
  }

  private async extractMentions(
    input: MonitoringRunInput,
    responses: MonitoringEngineResponse[],
  ): Promise<Map<string, MonitoringMention[]>> {
    const monitoredBrands = [
      { name: input.profile.name, domain: input.profile.domain },
      ...input.competitors,
    ];
    const mentionEntries = await Promise.all(
      responses.map(
        async (response): Promise<[string, MonitoringMention[]]> => {
          try {
            const mentionedDomains = await extractBrandMentions(
              this.groqService,
              response.content,
              monitoredBrands,
            );
            return [
              response.responseKey,
              mentionedDomains.map((domain) => ({ domain })),
            ];
          } catch (error) {
            this.logger.warn(
              `[${input.businessId}] Mention extraction failed responseKey=${response.responseKey}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
            return [response.responseKey, []];
          }
        },
      ),
    );

    return new Map(mentionEntries);
  }

  private async inferFanOutQueries(
    input: MonitoringRunInput,
    responses: MonitoringEngineResponse[],
  ): Promise<Map<string, string[]>> {
    const promptById = new Map(
      input.prompts.map((prompt) => [prompt.id, prompt.text]),
    );
    const inferenceCandidates = responses.flatMap((response) => {
      if (
        !INFERENCE_ENGINES.has(response.engine) ||
        response.fanOutQueries.length > 0
      ) {
        return [];
      }

      const sources = prepareInferenceSources(response.inferenceSources);
      return sources.length > 0
        ? [
            {
              responseKey: response.responseKey,
              prompt: promptById.get(response.promptId) ?? "",
              sources,
            },
          ]
        : [];
    });
    if (inferenceCandidates.length === 0) {
      return new Map();
    }

    const inferencePrompt = await loadPromptHbs(
      "infer-fan-out-queries",
      {},
      { baseDir: PROMPT_DIRECTORY },
    );
    const queryEntries = await Promise.all(
      inferenceCandidates.map(
        async (candidate): Promise<[string, string[]]> => {
          try {
            const parsedResponse = await this.groqService.parse({
              name: "infer-fan-out-queries",
              schema: FanOutQueriesSchema,
              model: FAN_OUT_INFERENCE_MODEL,
              temperature: 0,
              messages: [
                { role: "system", content: inferencePrompt },
                {
                  role: "user",
                  content: JSON.stringify({
                    prompt: candidate.prompt,
                    sources: candidate.sources,
                  }),
                },
              ],
            });
            return [
              candidate.responseKey,
              deduplicateQueries(parsedResponse.queries),
            ];
          } catch (error) {
            this.logger.warn(
              `[${input.businessId}] Fan-out inference failed responseKey=${candidate.responseKey}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
            return [candidate.responseKey, []];
          }
        },
      ),
    );

    return new Map(queryEntries);
  }
}
