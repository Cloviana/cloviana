import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { CHUNK_SIZE, MAX_RETRIES } from "./prompt-research.constants";
import type {
  PromptCandidateRecord,
  PromptResearchInput,
  UnclassifiedPromptRecord,
} from "./prompt-research.schemas";
import { PromptClassificationsSchema } from "./prompt-research.schemas";
import { assertCoverage } from "./prompt-research.utils";

const CLASSIFICATION_CONCURRENCY = 5;

export async function classifyPrompts({
  groq,
  promptsBaseDir,
  businessContext,
  prompts,
}: {
  groq: GroqService;
  promptsBaseDir: string;
  businessContext: PromptResearchInput;
  prompts: UnclassifiedPromptRecord[];
}): Promise<PromptCandidateRecord[]> {
  if (prompts.length === 0) {
    return [];
  }

  const systemPrompt = await loadPromptHbs(
    "classify-prompts",
    {},
    { baseDir: promptsBaseDir },
  );

  const chunks: UnclassifiedPromptRecord[][] = [];
  for (let i = 0; i < prompts.length; i += CHUNK_SIZE) {
    chunks.push(prompts.slice(i, i + CHUNK_SIZE));
  }

  const limit = pLimit(CLASSIFICATION_CONCURRENCY);
  const results = await Promise.all(
    chunks.map((chunk) =>
      limit(() =>
        pRetry(
          async () => {
            const result = await groq.parse({
              name: "classify-prompts",
              schema: PromptClassificationsSchema,
              model: "openai/gpt-oss-20b",
              reasoning_effort: "low",
              temperature: 0,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: JSON.stringify({ businessContext, prompts: chunk }),
                },
              ],
            });

            assertCoverage(
              chunk.map(({ promptId }) => promptId),
              result.classifications.map(({ promptId }) => promptId),
              "classify-prompts",
            );

            return result.classifications;
          },
          { retries: MAX_RETRIES - 1 },
        ),
      ),
    ),
  );

  const stageById = new Map(results.flat().map((c) => [c.promptId, c.stage]));

  return prompts.map((p) => {
    const awarenessStage = stageById.get(p.promptId);
    if (!awarenessStage) {
      throw new Error(
        `[classify-prompts] Missing awareness stage for promptId: ${p.promptId}`,
      );
    }

    return {
      promptId: p.promptId,
      prompt: p.prompt,
      awarenessStage,
      active: false,
    };
  });
}
