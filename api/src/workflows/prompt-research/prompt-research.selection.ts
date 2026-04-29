import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import type {
  AwarenessStage,
  PromptCandidateRecord,
  PromptResearchInput,
  ScoredPromptRecord,
} from "./prompt-research.schemas";
import { makeGeneratedPromptsSchema } from "./prompt-research.schemas";
import { SCORE_THRESHOLD, scorePrompts } from "./prompt-research.scoring";

const TARGETS = {
  total: 100,
  active: 30,
} as const;

const STAGE_DISTRIBUTION: ReadonlyArray<{
  stage: AwarenessStage;
  weight: number;
}> = [
  { stage: "EXPLORE", weight: 0.3 },
  { stage: "EVALUATE", weight: 0.5 },
  { stage: "DECIDE", weight: 0.2 },
];

const STAGE_PROMPT: Record<AwarenessStage, string> = {
  EXPLORE: "generate-explore-prompts",
  EVALUATE: "generate-evaluate-prompts",
  DECIDE: "generate-decide-prompts",
};

function stageBreakdown(prompts: ScoredPromptRecord[]): string {
  return STAGE_DISTRIBUTION.map(({ stage }) => {
    const count = prompts.filter((p) => p.awarenessStage === stage).length;
    const pct =
      prompts.length > 0 ? ((count / prompts.length) * 100).toFixed(0) : "0";
    return `${stage}=${count}(${pct}%)`;
  }).join("  ");
}

export async function selectPrompts({
  groq,
  openai,
  promptsBaseDir,
  businessContext,
  scoredCandidates,
}: {
  groq: GroqService;
  openai: OpenAIService;
  promptsBaseDir: string;
  businessContext: PromptResearchInput;
  scoredCandidates: ScoredPromptRecord[];
}): Promise<PromptCandidateRecord[]> {
  if (scoredCandidates.length === 0) {
    return [];
  }

  console.info(
    `[select-prompts] Starting — candidates: ${scoredCandidates.length}  —  ${stageBreakdown(scoredCandidates)}`,
  );

  const totalTargets = deriveStageTargets(TARGETS.total);
  const activeTargets = deriveStageTargets(TARGETS.active);

  console.debug(
    `[select-prompts] Stage targets — total: ${STAGE_DISTRIBUTION.map(({ stage }) => `${stage}=${totalTargets.get(stage)}`).join("  ")} | active: ${STAGE_DISTRIBUTION.map(({ stage }) => `${stage}=${activeTargets.get(stage)}`).join("  ")}`,
  );

  // --- Filter at threshold ---
  const survivors = scoredCandidates.filter(
    ({ score }) => score >= SCORE_THRESHOLD,
  );
  const dropped = scoredCandidates.length - survivors.length;

  if (dropped > 0) {
    console.warn(
      `[select-prompts] Dropped ${dropped}/${scoredCandidates.length} candidates below threshold (score < ${SCORE_THRESHOLD})`,
    );
  }
  console.info(
    `[select-prompts] Survivors after threshold: ${survivors.length}  —  ${stageBreakdown(survivors)}`,
  );

  // --- Group survivors by stage ---
  const survivorsByStage = new Map<AwarenessStage, ScoredPromptRecord[]>();
  for (const prompt of survivors) {
    const stagePrompts = survivorsByStage.get(prompt.awarenessStage) ?? [];
    stagePrompts.push(prompt);
    survivorsByStage.set(prompt.awarenessStage, stagePrompts);
  }

  const nextPromptId =
    Math.max(0, ...scoredCandidates.map(({ promptId }) => promptId)) + 1;
  let promptIdCounter = nextPromptId;

  // --- Generate fill prompts per stage ---
  const generatedByStage = await Promise.all(
    STAGE_DISTRIBUTION.map(async ({ stage }) => {
      const existing = survivorsByStage.get(stage) ?? [];
      const missing = Math.max(
        0,
        (totalTargets.get(stage) ?? 0) - existing.length,
      );

      if (missing === 0) {
        console.debug(
          `[select-prompts] ${stage}: ${existing.length} survivors — no fill needed`,
        );
        return [];
      }

      console.info(
        `[select-prompts] ${stage}: ${existing.length} survivors — generating ${missing} fill prompts…`,
      );

      const stagePrompt = await loadPromptHbs(
        STAGE_PROMPT[stage],
        {},
        { baseDir: promptsBaseDir },
      );

      const result = await openai.parse({
        name: STAGE_PROMPT[stage],
        schema: makeGeneratedPromptsSchema(missing),
        model: "gpt-4.1-mini",
        temperature: 0.9,
        input: [
          { role: "system", content: stagePrompt },
          {
            role: "user",
            content: JSON.stringify({
              businessContext,
              awarenessStage: stage,
              count: missing,
              existingPrompts: existing.map(({ prompt }) => prompt),
            }),
          },
        ],
      });

      console.debug(
        `[select-prompts] ${stage}: generated ${result.parsed.prompts.length} fill prompts`,
      );

      return result.parsed.prompts.map(
        (prompt): ScoredPromptRecord => ({
          promptId: promptIdCounter++,
          prompt,
          awarenessStage: stage,
          active: false,
          score: -1, // placeholder — scored below
        }),
      );
    }),
  );

  const generatedFlat = generatedByStage.flat();
  console.info(
    `[select-prompts] Total generated fill prompts: ${generatedFlat.length}`,
  );

  // --- Score fill prompts ---
  const scoredFills =
    generatedFlat.length === 0
      ? []
      : await scorePrompts({
          groq,
          promptsBaseDir,
          businessContext,
          promptCandidates: generatedFlat,
        });

  const fillScoreById = new Map(
    scoredFills.map(({ promptId, score }) => [promptId, score]),
  );

  const generated: ScoredPromptRecord[] = generatedFlat.map((p) => ({
    ...p,
    score: fillScoreById.get(p.promptId) ?? 0,
  }));

  if (generated.length > 0) {
    const fillScores = generated
      .map(({ score }) => score)
      .sort((a, b) => a - b);
    console.debug(
      `[select-prompts] Fill prompt scores — min: ${fillScores[0]}  median: ${fillScores[Math.floor(fillScores.length / 2)]}  max: ${fillScores.at(-1)}`,
    );
  }

  // --- Cap each stage at its total target (best by score) ---
  const combined = [...survivors, ...generated];
  const allScored: ScoredPromptRecord[] = STAGE_DISTRIBUTION.flatMap(
    ({ stage }) => {
      const stagePrompts = combined
        .filter((p) => p.awarenessStage === stage)
        .sort((a, b) => b.score - a.score || a.promptId - b.promptId)
        .slice(0, totalTargets.get(stage) ?? 0);

      const target = totalTargets.get(stage) ?? 0;
      if (stagePrompts.length < target) {
        console.warn(
          `[select-prompts] ${stage}: only ${stagePrompts.length}/${target} prompts available after fill`,
        );
      } else {
        console.debug(
          `[select-prompts] ${stage}: ${stagePrompts.length}/${target} prompts in pool`,
        );
      }

      return stagePrompts;
    },
  );

  console.info(
    `[select-prompts] Final pool: ${allScored.length}  —  ${stageBreakdown(allScored)}`,
  );

  // --- Select active set ---
  const selectedActiveIds = new Set<number>();

  for (const { stage } of STAGE_DISTRIBUTION) {
    const stageTarget = activeTargets.get(stage) ?? 0;
    const stagePrompts = allScored
      .filter((p) => p.awarenessStage === stage)
      .slice(0, stageTarget);

    for (const { promptId } of stagePrompts) {
      selectedActiveIds.add(promptId);
    }
  }

  if (selectedActiveIds.size < TARGETS.active) {
    const shortfall = TARGETS.active - selectedActiveIds.size;
    console.warn(
      `[select-prompts] Active quota shortfall — need ${TARGETS.active}, have ${selectedActiveIds.size}; backfilling ${shortfall} from remaining pool`,
    );

    for (const { promptId } of allScored) {
      if (selectedActiveIds.has(promptId)) continue;
      selectedActiveIds.add(promptId);
      if (selectedActiveIds.size === TARGETS.active) break;
    }
  }

  console.info(
    `[select-prompts] Done — total: ${allScored.length}  active: ${selectedActiveIds.size}  inactive: ${allScored.length - selectedActiveIds.size}`,
  );

  return allScored.map(({ promptId, prompt, awarenessStage }) => ({
    promptId,
    prompt,
    awarenessStage,
    active: selectedActiveIds.has(promptId),
  }));
}

function deriveStageTargets(totalCount: number): Map<AwarenessStage, number> {
  const targets = new Map<AwarenessStage, number>();
  const remainders: Array<{ stage: AwarenessStage; remainder: number }> = [];
  let assigned = 0;

  for (const { stage, weight } of STAGE_DISTRIBUTION) {
    const exact = totalCount * weight;
    const base = Math.floor(exact);
    targets.set(stage, base);
    assigned += base;
    remainders.push({ stage, remainder: exact - base });
  }

  remainders.sort(
    (a, b) =>
      b.remainder - a.remainder ||
      STAGE_DISTRIBUTION.findIndex(({ stage }) => stage === a.stage) -
        STAGE_DISTRIBUTION.findIndex(({ stage }) => stage === b.stage),
  );

  for (let i = 0; i < totalCount - assigned; i++) {
    const item = remainders[i];
    if (!item) break;
    targets.set(item.stage, (targets.get(item.stage) ?? 0) + 1);
  }

  return targets;
}
