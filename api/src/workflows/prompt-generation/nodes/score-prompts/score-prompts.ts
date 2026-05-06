import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import pLimit from "p-limit";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type { Prompt } from "../../prompt-generation.types";

const CONCURRENT_REQUESTS = 5;
const DEFAULT_PROMPT_SCORE_THRESHOLD = 65;
const EXPLORE_PROMPT_SCORE_THRESHOLD = 60;

const PromptScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
});

export async function scorePrompts(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq, logger } = requirePromptGenerationDependencies(config);
  const limit = pLimit(CONCURRENT_REQUESTS);

  logger?.debug(
    `[${state._businessId}] Scoring ${state.prompts.length} prompts`,
  );

  const scoredPrompts = await Promise.all(
    state.prompts.map((prompt) =>
      limit(() => scorePrompt(prompt, state, groq)),
    ),
  );
  const prompts = scoredPrompts.filter((prompt) =>
    meetsPromptScoreThreshold(prompt),
  );

  logger?.debug(
    `[${state._businessId}] Kept ${prompts.length} of ${scoredPrompts.length} scored prompts`,
  );

  return {
    prompts,
  };
}

function meetsPromptScoreThreshold(prompt: Prompt): boolean {
  const threshold =
    prompt.stage === "EXPLORE"
      ? EXPLORE_PROMPT_SCORE_THRESHOLD
      : DEFAULT_PROMPT_SCORE_THRESHOLD;

  return (prompt.score ?? 0) >= threshold;
}

async function scorePrompt(
  prompt: Prompt,
  state: typeof StateAnnotation.State,
  groq: ReturnType<typeof requirePromptGenerationDependencies>["groq"],
): Promise<Prompt> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const systemPrompt = await loadPromptHbs("score-prompts", {}, { baseDir });

  const result = await groq.parse({
    name: "score-prompts",
    schema: PromptScoreSchema,
    model: "openai/gpt-oss-20b",
    reasoning_effort: "low",
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          profile: state.profile,
          competitors: state.competitors,
          prompt,
        }),
      },
    ],
  });

  return {
    ...prompt,
    score: result.score,
  };
}
