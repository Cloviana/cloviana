import { z } from "zod";
import {
  ComparisonRole,
  ProblemSolutionRole,
  ROLE,
} from "../constants/roles.constants";

const Bool = z.boolean();

export const CritiqueRuleIdSchema = z.enum([
  "no_meta_language",
  "claims_defensibility",
  "no_medical_certainty",
  "no_generic_filler",
  "markdown_only",

  "word_budget_section",
  "blocks_contract",

  "keywords_appear",

  "featured_assets_all_linked",
  "no_standalone_product_links",

  "baseline_consistency",
  "decision_hinge_is_choice_framework",
  "segment_clarity_no_overlap",
]);

export const CritiqueIssueSchema = z.object({
  ruleId: CritiqueRuleIdSchema,
  evidence: z.string().min(1),
  fix: z.string().min(1),
});

const ReviewChecklistBaseSchema = z.object({
  no_meta_language: Bool,
  claims_defensibility: Bool,
  no_medical_certainty: Bool,
  no_generic_filler: Bool,

  word_budget_section: Bool,
  blocks_contract: Bool,

  keywords_appear: Bool,
  markdown_only: Bool,
});

type Role = ProblemSolutionRole | ComparisonRole;

const roleExtras = {
  [ROLE.INTRO]: {},

  [ROLE.PROBLEM]: {},
  [ROLE.SOLUTION_FRAMEWORK]: {},

  [ROLE.PRODUCT_RECOMMENDATION]: {
    featured_assets_all_linked: Bool,
    no_standalone_product_links: Bool,
  },

  [ROLE.OBJECTIONS]: {
    featured_assets_all_linked: Bool,
    no_standalone_product_links: Bool,
  },

  [ROLE.CONCLUSION_CTA]: {
    featured_assets_all_linked: Bool,
    no_standalone_product_links: Bool,
  },

  [ROLE.SHARED_BASELINE]: {
    baseline_consistency: Bool,
  },

  [ROLE.OPTION_A_ANALYSIS]: {
    baseline_consistency: Bool,
  },

  [ROLE.OPTION_B_ANALYSIS]: {
    baseline_consistency: Bool,
  },

  [ROLE.WHO_SHOULD_CHOOSE]: {
    segment_clarity_no_overlap: Bool,
  },

  [ROLE.DECISION_AND_RECOMMENDATION]: {
    featured_assets_all_linked: Bool,
    no_standalone_product_links: Bool,
  },
} as const;

function checklistForRole(role: Role) {
  const extras = (roleExtras as Record<string, z.ZodRawShape>)[role] ?? {};
  return ReviewChecklistBaseSchema.extend({
    role: z.literal(role),
    ...extras,
  });
}

export const ReviewChecklistSchema = z.discriminatedUnion("role", [
  checklistForRole(ROLE.INTRO),

  checklistForRole(ROLE.PROBLEM),
  checklistForRole(ROLE.SOLUTION_FRAMEWORK),

  checklistForRole(ROLE.PRODUCT_RECOMMENDATION),
  checklistForRole(ROLE.OBJECTIONS),
  checklistForRole(ROLE.CONCLUSION_CTA),

  checklistForRole(ROLE.SHARED_BASELINE),

  checklistForRole(ROLE.OPTION_A_ANALYSIS),
  checklistForRole(ROLE.OPTION_B_ANALYSIS),

  checklistForRole(ROLE.WHO_SHOULD_CHOOSE),
  checklistForRole(ROLE.DECISION_AND_RECOMMENDATION),
]);

export type ReviewChecklist = z.infer<typeof ReviewChecklistSchema>;

export const ReviewSectionSchema = z
  .object({
    pass: Bool,
    checklist: ReviewChecklistSchema,
    issues: z.array(CritiqueIssueSchema),
  })
  .superRefine(passInvariant);

export type ReviewSection = z.infer<typeof ReviewSectionSchema>;

function passInvariant(val: any, ctx: z.RefinementCtx) {
  if (!val.pass) return;

  if (val.issues.length !== 0) {
    ctx.addIssue({ code: "custom", message: "pass=true requires issues=[]" });
  }

  const checklist = val.checklist ?? {};
  const statuses = Object.entries(checklist)
    .filter(([k]) => k !== "role")
    .map(([, v]) => v) as boolean[];

  if (statuses.some((s) => s === false)) {
    ctx.addIssue({
      code: "custom",
      message: 'pass=true requires no checklist item to be "fail"',
    });
  }
}
