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
import type {
  BusinessProfile,
  Cluster,
  Competitor,
  Prompt,
} from "../../prompt-generation.types";

const CONCURRENT_REQUESTS = 5;

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
  anthropic: ReturnType<
    typeof requirePromptGenerationDependencies
  >["anthropic"];
  businessId: string;
  cluster: Cluster;
  competitors: Competitor[];
  logger: ReturnType<typeof requirePromptGenerationDependencies>["logger"];
  profile: BusinessProfile;
  systemPrompt: string;
};

export async function generatePrompts(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { anthropic, logger } = requirePromptGenerationDependencies(config);
  const limit = pLimit(CONCURRENT_REQUESTS);

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
      limit(() =>
        generatePromptsForCluster({
          anthropic,
          businessId: state.businessId,
          cluster,
          competitors: state.competitors,
          logger,
          profile: state.profile,
          systemPrompt,
        }),
      ),
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
  anthropic,
  businessId,
  cluster,
  competitors,
  logger,
  profile,
  systemPrompt,
}: GeneratePromptsForClusterInput): Promise<Prompt[]> {
  logger?.debug(
    `[${businessId}] Generating prompts for cluster "${cluster.name}"`,
  );

  const result = await anthropic.parse({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral", ttl: "5m" },
      },
    ],
    schema: GeneratePromptsSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({ profile, competitors }),
            cache_control: { type: "ephemeral", ttl: "5m" },
          },
          {
            type: "text",
            text: JSON.stringify({ cluster }),
          },
        ],
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
