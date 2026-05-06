import { StateAnnotation } from "../../prompt-generation.state";
import type { Prompt } from "../../prompt-generation.types";

const MAX_PROMPTS = 100;
const ACTIVE_PROMPT_TARGET = 30;

const STAGE_TARGETS: { stage: Prompt["stage"]; percentage: number }[] = [
  { stage: "EXPLORE", percentage: 0.3 },
  { stage: "EVALUATE", percentage: 0.5 },
  { stage: "DECIDE", percentage: 0.2 },
];

export async function createPromptUniverse(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  const byStage = new Map<Prompt["stage"], Prompt[]>();

  for (const { stage } of STAGE_TARGETS) {
    byStage.set(
      stage,
      state.prompts
        .filter((p) => p.stage === stage)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    );
  }

  const activeIds = new Set<string>();

  for (const { stage, percentage } of STAGE_TARGETS) {
    const candidates = byStage.get(stage) ?? [];
    const count = Math.round(ACTIVE_PROMPT_TARGET * percentage);

    for (const prompt of candidates.slice(0, count)) {
      activeIds.add(prompt.id);
    }
  }

  const active = state.prompts
    .filter((p) => activeIds.has(p.id))
    .map((p) => ({ ...p, active: true as const }));

  const inactive = state.prompts
    .filter((p) => !activeIds.has(p.id))
    .map((p) => ({ ...p, active: false as const }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, MAX_PROMPTS - active.length);

  const allPrompts = [...active, ...inactive];

  const clusterIdsWithPrompts = new Set(allPrompts.map((p) => p.clusterId));
  const clusters = state.clusters.filter((c) =>
    clusterIdsWithPrompts.has(c.id),
  );

  return {
    promptUniverse: {
      prompts: allPrompts,
      clusters,
    },
  };
}
