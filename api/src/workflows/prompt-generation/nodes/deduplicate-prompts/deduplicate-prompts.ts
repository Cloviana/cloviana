import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";

const DeduplicatePromptsSchema = z.object({
  groups: z.array(
    z.object({
      canonicalId: z.string(),
      duplicateIds: z.array(z.string()),
    }),
  ),
});

export async function deduplicatePrompts(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { openai, logger } = requirePromptGenerationDependencies(config);

  if (state.prompts.length <= 1) {
    return { prompts: state.prompts };
  }

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const systemPrompt = await loadPromptHbs(
    "deduplicate-prompts",
    {},
    { baseDir },
  );

  logger?.debug(
    `[${state._businessId}] Deduplicating ${state.prompts.length} prompts`,
  );

  const result = await openai.parse({
    name: "deduplicate-prompts",
    schema: DeduplicatePromptsSchema,
    model: "gpt-4.1-mini",
    temperature: 0,
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          prompts: state.prompts.map((p) => ({
            id: p.id,
            text: p.text,
            stage: p.stage,
            score: p.score ?? 0,
          })),
        }),
      },
    ],
  });

  const validIds = new Set(state.prompts.map((p) => p.id));

  const duplicateIds = new Set(
    result.parsed.groups.flatMap((g) =>
      g.duplicateIds.filter((id) => validIds.has(id) && id !== g.canonicalId),
    ),
  );

  const prompts = state.prompts.filter((p) => !duplicateIds.has(p.id));

  logger?.debug(
    `[${state._businessId}] Removed ${duplicateIds.size} duplicates, kept ${prompts.length} prompts`,
  );

  return { prompts };
}
