export const REVIEW_PROMPT_MAP = {
  intro: "review/review-section.intro",
  problem: "review/review-section.problem",
  solution_framework: "review/review-section.solution-framework",
  product_recommendation: "review/review-section.product-recommendation",
  objections: "review/review-section.objections",
  conclusion_cta: "review/review-section.conclusion-cta",
} as const;

export type ReviewPrompt = keyof typeof REVIEW_PROMPT_MAP;
