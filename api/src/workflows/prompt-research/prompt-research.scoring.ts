import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { CHUNK_SIZE, MAX_RETRIES } from "./prompt-research.constants";
import type {
  PromptCandidateRecord,
  PromptResearchInput,
  PromptScore,
  ScoredPromptRecord,
} from "./prompt-research.schemas";
import { PromptScoresSchema } from "./prompt-research.schemas";
import { assertCoverage } from "./prompt-research.utils";

const SCORE_THRESHOLD = 65;
const SCORE_CONCURRENCY = 5;

export { SCORE_THRESHOLD };

export async function scorePrompts({
  groq,
  promptsBaseDir,
  businessContext,
  promptCandidates,
}: {
  groq: GroqService;
  promptsBaseDir: string;
  businessContext: PromptResearchInput;
  promptCandidates: PromptCandidateRecord[];
}): Promise<ScoredPromptRecord[]> {
  if (promptCandidates.length === 0) {
    return [];
  }

  console.info(
    `[score-prompts] Scoring ${promptCandidates.length} candidates…`,
  );

  const scorePrompt = await loadPromptHbs(
    "select-prompts",
    {},
    { baseDir: promptsBaseDir },
  );

  const scores = await runScoring({
    groq,
    prompt: scorePrompt,
    businessContext,
    promptCandidates,
  });

  const scoreById = new Map(
    scores.map(({ promptId, score }) => [promptId, score]),
  );

  const scored: ScoredPromptRecord[] = promptCandidates.map((candidate) => ({
    ...candidate,
    score: scoreById.get(candidate.promptId) ?? 0,
  }));

  const values = scored.map(({ score }) => score).sort((a, b) => a - b);
  console.debug(
    `[score-prompts] Distribution — min: ${values[0]}  median: ${values[Math.floor(values.length / 2)]}  max: ${values.at(-1)}`,
  );

  return scored;
}

async function runScoring({
  groq,
  prompt,
  businessContext,
  promptCandidates,
}: {
  groq: GroqService;
  prompt: string;
  businessContext: PromptResearchInput;
  promptCandidates: PromptCandidateRecord[];
}): Promise<PromptScore[]> {
  const limit = pLimit(SCORE_CONCURRENCY);
  const chunks = Array.from(
    { length: Math.ceil(promptCandidates.length / CHUNK_SIZE) },
    (_, index) =>
      promptCandidates.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );

  console.debug(
    `[score-prompts] ${promptCandidates.length} prompts across ${chunks.length} chunk(s)…`,
  );

  const results = await Promise.all(
    chunks.map((chunk, i) =>
      limit(() =>
        pRetry(
          async (attempt) => {
            if (attempt > 1) {
              console.warn(
                `[score-prompts] Chunk ${i + 1}/${chunks.length} retry attempt ${attempt}`,
              );
            }

            const result = await groq.parse({
              name: "score-prompts",
              schema: PromptScoresSchema,
              model: "openai/gpt-oss-120b",
              reasoning_effort: "low",
              temperature: 0,
              messages: [
                { role: "system", content: prompt },
                {
                  role: "user",
                  content: JSON.stringify({ businessContext, prompts: chunk }),
                },
              ],
            });

            assertCoverage(
              chunk.map(({ promptId }) => promptId),
              result.scores.map(({ promptId }) => promptId),
              "score-prompts",
            );

            return result.scores;
          },
          { retries: MAX_RETRIES - 1 },
        ),
      ),
    ),
  );

  return results.flat();
}
