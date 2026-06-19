import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type {
  BusinessProfile,
  Cluster,
  Competitor,
  Prompt,
} from "../../prompt-generation.types";

const GeneratePromptsSchema = z.object({
  prompts: z
    .array(
      z.object({
        text: z.string().min(1),
        stage: z.enum(["EXPLORE", "EVALUATE", "DECIDE"]),
      }),
    )
    .min(9)
    .max(9),
});

type GeneratePromptsForClusterInput = {
  businessId: string;
  cluster: Cluster;
  competitors: Competitor[];
  groq: ReturnType<typeof requirePromptGenerationDependencies>["groq"];
  logger: ReturnType<typeof requirePromptGenerationDependencies>["logger"];
  profile: BusinessProfile;
  systemPrompt: string;
};

export async function generatePrompts(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq, logger } = requirePromptGenerationDependencies(config);
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const systemPrompt = await loadPromptHbs("generate-prompts", {}, { baseDir });

  logger?.debug(
    `[${state.businessId}] Generating prompts for ${state.clusters.length} clusters`,
  );

  const prompts = await Promise.all(
    state.clusters.map((cluster) =>
      generatePromptsForCluster({
        businessId: state.businessId,
        cluster,
        competitors: state.competitors,
        groq,
        logger,
        profile: state.profile,
        systemPrompt,
      }),
    ),
  );

  const flat = prompts.flat();

  logger?.debug(
    `[${state.businessId}] Generated ${flat.length} prompts across ${state.clusters.length} clusters`,
  );

  return {
    prompts: flat,
  };
}

async function generatePromptsForCluster({
  businessId,
  cluster,
  competitors,
  groq,
  logger,
  profile,
  systemPrompt,
}: GeneratePromptsForClusterInput): Promise<Prompt[]> {
  logger?.debug(
    `[${businessId}] Generating prompts for cluster "${cluster.name}"`,
  );

  const result = await groq.parse({
    name: "generate-prompts",
    schema: GeneratePromptsSchema,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({ profile, competitors, cluster }),
      },
    ],
  });

  return result.prompts.map((p, i) => ({
    id: `${cluster.id}-prompt-${i + 1}`,
    clusterId: cluster.id,
    text: p.text,
    stage: p.stage,
  }));
}
