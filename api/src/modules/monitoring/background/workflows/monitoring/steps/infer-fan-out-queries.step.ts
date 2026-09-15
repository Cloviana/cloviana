import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { Logger } from "@nestjs/common";
import { AiEngine } from "@prisma/client";
import { z } from "zod";
import type {
  MonitoringCitation,
  MonitoringEngineResponse,
  SerializedMonitoringRunInput,
} from "../monitoring.types";

const FAN_OUT_INFERENCE_MODEL = "openai/gpt-oss-120b";
const MAX_INFERRED_FAN_OUT_QUERIES = 3;
const INFERENCE_ENGINES = new Set<AiEngine>([
  AiEngine.CHATGPT,
  AiEngine.PERPLEXITY,
  AiEngine.AI_OVERVIEWS,
]);
const MIN_EXCERPT_LENGTH = 80;
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
  "../prompts",
);
const logger = new Logger("InferFanOutQueriesStep");

function normalizeComparisonText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
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

    const sourceKey = source.canonicalUrl;
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

export async function inferFanOutQueriesStep(
  groq: GroqService,
  input: SerializedMonitoringRunInput,
  responses: MonitoringEngineResponse[],
): Promise<Record<string, string[]>> {
  const promptById = new Map(
    input.prompts.map((prompt) => [prompt.id, prompt.text]),
  );
  const candidates = responses.flatMap((response) => {
    if (
      !INFERENCE_ENGINES.has(response.engine) ||
      response.fanOutQueries.length > 0 ||
      response.citations.length === 0
    ) {
      return [];
    }

    const sources = prepareInferenceSources(response.citations);
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
  if (candidates.length === 0) {
    return {};
  }

  const inferencePrompt = await loadPromptHbs(
    "infer-fan-out-queries",
    {},
    { baseDir: PROMPT_DIRECTORY },
  );
  const entries = await Promise.all(
    candidates.map(async (candidate): Promise<[string, string[]]> => {
      try {
        const parsedResponse = await groq.parse({
          name: "infer-fan-out-queries",
          schema: FanOutQueriesSchema,
          model: FAN_OUT_INFERENCE_MODEL,
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
        logger.warn(
          `[${input.businessId}] Fan-out inference failed responseKey=${candidate.responseKey}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return [candidate.responseKey, []];
      }
    }),
  );

  return Object.fromEntries(entries);
}
