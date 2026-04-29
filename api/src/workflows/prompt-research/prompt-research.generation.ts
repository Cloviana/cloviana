import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import pLimit from "p-limit";
import type {
  PromptResearchInput,
  Signal,
  UnclassifiedPromptRecord,
} from "./prompt-research.schemas";
import { UnclassifiedGeneratedPromptsSchema } from "./prompt-research.schemas";
import { normalizePrompt } from "./prompt-research.utils";

const GENERATION_CONCURRENCY = 10;

export async function generatePrompts({
  groq,
  promptsBaseDir,
  businessContext,
  signals,
}: {
  groq: GroqService;
  promptsBaseDir: string;
  businessContext: PromptResearchInput;
  signals: Signal[];
}): Promise<UnclassifiedPromptRecord[]> {
  const prompt = await loadPromptHbs(
    "generate-prompts",
    {},
    { baseDir: promptsBaseDir },
  );

  const limit = pLimit(GENERATION_CONCURRENCY);
  const results = await Promise.all(
    signals.map((signal) =>
      limit(() =>
        groq.parse({
          name: "generate-prompts",
          schema: UnclassifiedGeneratedPromptsSchema,
          model: "openai/gpt-oss-120b",
          reasoning_effort: "low",
          temperature: 0.3,
          messages: [
            { role: "system", content: prompt },
            {
              role: "user",
              content: JSON.stringify({ businessContext, signal }),
            },
          ],
        }),
      ),
    ),
  );

  return toUnclassifiedPromptRecords(
    results.flatMap((result) => result.prompts),
  ).slice(0, 500);
}

function toUnclassifiedPromptRecords(
  prompts: string[],
): UnclassifiedPromptRecord[] {
  const seen = new Map<string, UnclassifiedPromptRecord>();

  for (const prompt of prompts) {
    const key = normalizePrompt(prompt);
    if (!seen.has(key)) {
      seen.set(key, { promptId: seen.size, prompt });
    }
  }

  return Array.from(seen.values());
}
