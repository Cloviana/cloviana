export const REVISE_PROMPT_MAP = {
  intro: "revise/revise-section.intro",
  problem: "revise/revise-section.problem",
  solution_framework: "revise/revise-section.solution-framework",
  product_recommendation: "revise/revise-section.product-recommendation",
  objections: "revise/revise-section.objections",
  conclusion_cta: "revise/revise-section.conclusion-cta",
} as const;

export type RevisePrompt = keyof typeof REVISE_PROMPT_MAP;
