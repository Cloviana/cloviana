export const WRITER_PROMPT_MAP = {
  intro: "writer/write-section.intro",
  problem: "writer/write-section.problem",
  solution_framework: "writer/write-section.solution-framework",
  product_recommendation: "writer/write-section.product-recommendation",
  objections: "writer/write-section.objections",
  conclusion_cta: "writer/write-section.conclusion-cta",
} as const;

export type WriterPrompt = keyof typeof WRITER_PROMPT_MAP;
