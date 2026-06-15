import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";

const ClusterTaxonomySchema = z.object({
  clusters: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(1)
    .max(10),
});

export async function createClusterTaxonomy(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { logger, groq } = requirePromptGenerationDependencies(config);
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const prompt = await loadPromptHbs(
    "create-cluster-taxonomy",
    {},
    { baseDir },
  );

  logger?.debug(
    `[${state.businessId}] Creating cluster taxonomy from ${state.buyerLanguage.length} buyer language snippets`,
  );

  const result = await groq.parse({
    name: "create-cluster-taxonomy",
    schema: ClusterTaxonomySchema,
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          profile: state.profile,
          buyerLanguage: state.buyerLanguage,
        }),
      },
    ],
  });

  logger?.debug(
    `[${state.businessId}] Created ${result.clusters.length} cluster taxonomy items`,
  );

  return {
    clusters: result.clusters,
  };
}
