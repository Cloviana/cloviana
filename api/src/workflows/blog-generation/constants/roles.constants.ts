export const ROLE = {
  INTRO: "intro",
  PROBLEM: "problem",
  SOLUTION_FRAMEWORK: "solution-framework",
  PRODUCT_RECOMMENDATION: "product-recommendation",
  OBJECTIONS: "objections",
  CONCLUSION_CTA: "conclusion-cta",
  SHARED_BASELINE: "shared-baseline",
  OPTION_A_ANALYSIS: "option-a-analysis",
  OPTION_B_ANALYSIS: "option-b-analysis",
  DECISION_AND_RECOMMENDATION: "decision-and-recommendation",
  WHO_SHOULD_CHOOSE: "who-should-choose",
} as const;

export type RoleValue = (typeof ROLE)[keyof typeof ROLE];

export const PROBLEM_SOLUTION_ROLES = [
  ROLE.INTRO,
  ROLE.PROBLEM,
  ROLE.SOLUTION_FRAMEWORK,
  ROLE.PRODUCT_RECOMMENDATION,
  ROLE.OBJECTIONS,
  ROLE.CONCLUSION_CTA,
] as const;

export const COMPARISON_ROLES = [
  ROLE.INTRO,
  ROLE.SHARED_BASELINE,
  ROLE.OPTION_A_ANALYSIS,
  ROLE.OPTION_B_ANALYSIS,
  ROLE.WHO_SHOULD_CHOOSE,
  ROLE.DECISION_AND_RECOMMENDATION,
] as const;

export type ProblemSolutionRole = (typeof PROBLEM_SOLUTION_ROLES)[number];
export type ComparisonRole = (typeof COMPARISON_ROLES)[number];

export const TEMPLATE_IDS = ["problem-solution", "comparison"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TemplateRole<T extends TemplateId> = T extends "problem-solution"
  ? ProblemSolutionRole
  : T extends "comparison"
    ? ComparisonRole
    : never;

export const TEMPLATE_ROLE_SEQUENCES: {
  [K in TemplateId]: readonly TemplateRole<K>[];
} = {
  "problem-solution": PROBLEM_SOLUTION_ROLES,
  comparison: COMPARISON_ROLES,
} as const;

export const ROLE_WORD_WEIGHTS: {
  [T in TemplateId]: Record<TemplateRole<T>, number>;
} = {
  "problem-solution": {
    intro: 0.1,
    problem: 0.18,
    "solution-framework": 0.22,
    "product-recommendation": 0.22,
    objections: 0.18,
    "conclusion-cta": 0.1,
  },
  comparison: {
    intro: 0.08,
    "shared-baseline": 0.14,
    "option-a-analysis": 0.2,
    "option-b-analysis": 0.2,
    "who-should-choose": 0.18,
    "decision-and-recommendation": 0.2,
  },
} as const;
