import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type { BuyerLanguage, Cluster } from "../../prompt-generation.types";

const ClusterAssignmentSchema = z.object({
  clusterId: z.string().min(1).nullable(),
});

type ClusterAssignment = {
  buyerLanguageId: string;
  clusterId: string;
};

export async function assignBuyerLanguageToClusters(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq, logger } = requirePromptGenerationDependencies(config);
  logger?.debug(
    `[${state.businessId}] Assigning ${state.buyerLanguage.length} buyer language snippets to ${state.clusters.length} clusters`,
  );

  const assignments = await Promise.all(
    state.buyerLanguage.map((buyerLanguage) =>
      assignBuyerLanguageToCluster(buyerLanguage, state, groq),
    ),
  );

  const validAssignments = assignments.filter(
    (assignment): assignment is ClusterAssignment => assignment !== null,
  );

  const clusters = buildClusters(state, validAssignments);

  logger?.debug(
    `[${state.businessId}] Assigned buyer language into ${clusters.length} clusters`,
  );

  return {
    clusters,
  };
}

async function assignBuyerLanguageToCluster(
  buyerLanguage: BuyerLanguage,
  state: typeof StateAnnotation.State,
  groq: ReturnType<typeof requirePromptGenerationDependencies>["groq"],
): Promise<ClusterAssignment | null> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const prompt = await loadPromptHbs(
    "assign-buyer-language-to-clusters",
    {},
    { baseDir },
  );

  const result = await groq.parse({
    name: "assign-buyer-language-to-clusters",
    schema: ClusterAssignmentSchema,
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          clusters: state.clusters.map((cluster) => ({
            id: cluster.id,
            name: cluster.name,
            description: cluster.description,
          })),
          buyerLanguage,
        }),
      },
    ],
  });

  if (result.clusterId === null) {
    return null;
  }

  return {
    buyerLanguageId: buyerLanguage.id,
    clusterId: result.clusterId,
  };
}

function buildClusters(
  state: typeof StateAnnotation.State,
  assignments: { buyerLanguageId: string; clusterId: string }[],
): Cluster[] {
  const validClusterIds = new Set(state.clusters.map((cluster) => cluster.id));
  const buyerLanguageById = new Map(
    state.buyerLanguage.map((buyerLanguage) => [
      buyerLanguage.id,
      buyerLanguage,
    ]),
  );

  const assignedIdsByClusterId = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    if (!validClusterIds.has(assignment.clusterId)) {
      continue;
    }

    if (!buyerLanguageById.has(assignment.buyerLanguageId)) {
      continue;
    }

    const assignedIds =
      assignedIdsByClusterId.get(assignment.clusterId) ?? new Set<string>();

    if (
      [...assignedIdsByClusterId.values()].some((ids) =>
        ids.has(assignment.buyerLanguageId),
      )
    ) {
      continue;
    }

    assignedIds.add(assignment.buyerLanguageId);
    assignedIdsByClusterId.set(assignment.clusterId, assignedIds);
  }

  return state.clusters.map((cluster) => {
    const buyerLanguageIds = [
      ...(assignedIdsByClusterId.get(cluster.id) ?? new Set<string>()),
    ];

    const representativeQuotes = buyerLanguageIds
      .map((id) => buyerLanguageById.get(id))
      .filter((buyerLanguage) => buyerLanguage !== undefined)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((buyerLanguage) => buyerLanguage.text);

    return {
      ...cluster,
      buyerLanguageIds,
      representativeQuotes,
    };
  });
}
