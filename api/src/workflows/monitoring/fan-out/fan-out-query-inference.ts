// Asks an LLM (via Groq) to guess the hidden search queries an engine likely
// ran before answering, based on the pages it cited. Tries the cheaper batch
// API first, then retries anything that failed/malformed one at a time.
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import type { Logger } from "@nestjs/common";
import { z } from "zod";
import {
  FAN_OUT_INFERENCE_MODEL,
  MAX_INFERRED_FAN_OUT_QUERIES,
} from "../monitoring.constants";
import type { Citation } from "../monitoring.types";

const FanOutSchema = z.object({
  queries: z.array(z.string()).max(MAX_INFERRED_FAN_OUT_QUERIES),
});

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "prompts",
);

export type FanOutInferenceCandidate = {
  responseKey: string;
  prompt: string;
  sources: Citation[];
};

function parseQueries(content: string): string[] {
  const { queries } = FanOutSchema.parse(JSON.parse(content));
  return [
    ...new Map(
      queries
        .map((query) => query.trim())
        .filter(Boolean)
        .map((query) => [query.toLowerCase(), query]),
    ).values(),
  ];
}

function messages(systemPrompt: string, candidate: FanOutInferenceCandidate) {
  return [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: JSON.stringify({
        prompt: candidate.prompt,
        sources: candidate.sources,
      }),
    },
  ];
}

export async function inferFanOutQueries(
  groq: GroqService,
  candidates: FanOutInferenceCandidate[],
  options: { businessId: string; logger?: Logger },
): Promise<Map<string, string[]>> {
  const { businessId, logger } = options;
  const systemPrompt = await loadPromptHbs(
    "infer-fan-out-queries",
    {},
    { baseDir: PROMPT_DIRECTORY },
  );
  const candidateByKey = new Map(
    candidates.map((candidate) => [candidate.responseKey, candidate]),
  );
  const queriesByResponseKey = new Map<string, string[]>();
  const unresolvedKeys = new Set(candidateByKey.keys());

  try {
    const batchResults = await groq.batch(
      candidates.map((candidate) => ({
        custom_id: candidate.responseKey,
        body: {
          model: FAN_OUT_INFERENCE_MODEL,
          temperature: 0,
          messages: messages(systemPrompt, candidate),
          response_format: {
            type: "json_schema" as const,
            json_schema: {
              name: "infer-fan-out-queries",
              strict: true,
              schema: z.toJSONSchema(FanOutSchema),
            },
          },
        },
      })),
    );

    for (const result of batchResults) {
      if (!candidateByKey.has(result.custom_id)) continue;

      try {
        if (result.error || !result.content) {
          throw new Error(result.error ?? "Empty batch response");
        }

        queriesByResponseKey.set(
          result.custom_id,
          parseQueries(result.content),
        );
        unresolvedKeys.delete(result.custom_id);
      } catch {
        // Retry malformed or failed batch items individually below.
      }
    }
  } catch (error) {
    logger?.warn(
      `[${businessId}] Fan-out inference batch failed; retrying individually: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  await Promise.all(
    [...unresolvedKeys].map(async (responseKey) => {
      const candidate = candidateByKey.get(responseKey);
      if (!candidate) return;

      try {
        const result = await groq.parse({
          name: "infer-fan-out-queries",
          schema: FanOutSchema,
          model: FAN_OUT_INFERENCE_MODEL,
          temperature: 0,
          messages: messages(systemPrompt, candidate),
        });
        queriesByResponseKey.set(
          responseKey,
          parseQueries(JSON.stringify(result)),
        );
      } catch (error) {
        logger?.warn(
          `[${businessId}] Fan-out inference failed responseKey=${responseKey}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }),
  );

  return queriesByResponseKey;
}
