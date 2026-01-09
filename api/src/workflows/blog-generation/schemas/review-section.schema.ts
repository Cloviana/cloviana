import { z } from "zod";

export const CritiqueSeveritySchema = z.enum(["low", "medium", "high"]);

export const CritiqueRuleIdSchema = z.enum([
  "heading_rules",
  "no_meta_language",
  "bullet_list_limits",
  "no_labeled_subsections",
  "role_product_link_rules",
  "product_first_link",
  "link_count_conclusion",
  "no_products_in_disallowed_roles",
  "no_repetition_vs_draft_so_far",
  "no_new_claims",
  "no_medical_certainty",
  "grade_level_style",
  "talking_points_coverage",
  "goal_fulfillment",
  "keyword_intent_satisfaction",
  "defensibility_no_undefensible_lines",
  "word_budget_section"
]);

export const CritiqueIssueSchema = z.object({
  severity: CritiqueSeveritySchema,
  ruleId: CritiqueRuleIdSchema,
  sectionId: z.string(),
  location: z.object({
    kind: z.enum(["heading", "paragraph", "sentence", "link", "throughout"]),
    index: z.number().int().min(0).nullable(),
  }),
  evidence: z.string().min(1),
  fix: z.string().min(1),
});

const ReviewChecklistBaseSchema = z.object({
  no_meta_language: z.boolean(),
  bullet_list_limits: z.boolean(),
  no_labeled_subsections: z.boolean(),
  no_repetition_vs_draft_so_far: z.boolean(),
  no_new_claims: z.boolean(),
  no_medical_certainty: z.boolean(),
  grade_level_style: z.boolean(),
  talking_points_coverage: z.boolean(),
  goal_fulfillment: z.boolean(),
  keyword_intent_satisfaction: z.boolean(),
  defensibility_no_undefensible_lines: z.boolean(),
  word_budget_section: z.boolean(),
});

const ReviewChecklistIntroSchema = ReviewChecklistBaseSchema.extend({
  heading_rules: z.boolean(),
  no_products_in_disallowed_roles: z.boolean(),
});

const ReviewChecklistProblemSchema = ReviewChecklistBaseSchema.extend({
  heading_rules: z.boolean(),
  no_products_in_disallowed_roles: z.boolean(),
});

const ReviewChecklistSolutionFrameworkSchema = ReviewChecklistBaseSchema.extend({
  heading_rules: z.boolean(),
  no_products_in_disallowed_roles: z.boolean(),
});

const ReviewChecklistProductRecommendationSchema = ReviewChecklistBaseSchema.extend({
  heading_rules: z.boolean(),
  role_product_link_rules: z.boolean(),
  product_first_link: z.boolean(),
});

const ReviewChecklistObjectionsSchema = ReviewChecklistBaseSchema.extend({
  heading_rules: z.boolean(),
  role_product_link_rules: z.boolean(),
  no_products_in_disallowed_roles: z.boolean(),
});

const ReviewChecklistConclusionCtaSchema = ReviewChecklistBaseSchema.extend({
  heading_rules: z.boolean(),
  role_product_link_rules: z.boolean(),
  product_first_link: z.boolean(),
  link_count_conclusion: z.boolean(),
});

const ReviewSectionBaseFields = {
  pass: z.boolean(),
  role: z.enum([
    "intro",
    "problem",
    "solution_framework",
    "product_recommendation",
    "objections",
    "conclusion_cta",
  ]),
  sectionId: z.string(),
  summary: z.string().min(1),
  missingTalkingPoints: z.array(z.string()),
  issues: z.array(CritiqueIssueSchema),
};

const ReviewSectionIntroSchema = z
  .object({
    ...ReviewSectionBaseFields,
    role: z.literal("intro"),
    checklist: ReviewChecklistIntroSchema,
  })
  .superRefine(passInvariant);

const ReviewSectionProblemSchema = z
  .object({
    ...ReviewSectionBaseFields,
    role: z.literal("problem"),
    checklist: ReviewChecklistProblemSchema,
  })
  .superRefine(passInvariant);

const ReviewSectionSolutionFrameworkSchema = z
  .object({
    ...ReviewSectionBaseFields,
    role: z.literal("solution_framework"),
    checklist: ReviewChecklistSolutionFrameworkSchema,
  })
  .superRefine(passInvariant);

const ReviewSectionProductRecommendationSchema = z
  .object({
    ...ReviewSectionBaseFields,
    role: z.literal("product_recommendation"),
    checklist: ReviewChecklistProductRecommendationSchema,
  })
  .superRefine(passInvariant);

const ReviewSectionObjectionsSchema = z
  .object({
    ...ReviewSectionBaseFields,
    role: z.literal("objections"),
    checklist: ReviewChecklistObjectionsSchema,
  })
  .superRefine(passInvariant);

const ReviewSectionConclusionCtaSchema = z
  .object({
    ...ReviewSectionBaseFields,
    role: z.literal("conclusion_cta"),
    checklist: ReviewChecklistConclusionCtaSchema,
  })
  .superRefine(passInvariant);

export const ReviewSectionSchema = z.discriminatedUnion("role", [
  ReviewSectionIntroSchema,
  ReviewSectionProblemSchema,
  ReviewSectionSolutionFrameworkSchema,
  ReviewSectionProductRecommendationSchema,
  ReviewSectionObjectionsSchema,
  ReviewSectionConclusionCtaSchema,
]);

export type ReviewSection = z.infer<typeof ReviewSectionSchema>;

export function getReviewSchemaForRole(role: ReviewSection["role"]) {
  switch (role) {
    case "intro":
      return ReviewSectionIntroSchema;
    case "problem":
      return ReviewSectionProblemSchema;
    case "solution_framework":
      return ReviewSectionSolutionFrameworkSchema;
    case "product_recommendation":
      return ReviewSectionProductRecommendationSchema;
    case "objections":
      return ReviewSectionObjectionsSchema;
    case "conclusion_cta":
      return ReviewSectionConclusionCtaSchema;
    default:
      return ReviewSectionSchema;
  }
}

function passInvariant(val: any, ctx: z.RefinementCtx) {
  if (!val.pass) return;

  if (val.issues.length !== 0) {
    ctx.addIssue({ code: "custom", message: "pass=true requires issues=[]" });
  }

  if (val.missingTalkingPoints.length !== 0) {
    ctx.addIssue({
      code: "custom",
      message: "pass=true requires missingTalkingPoints=[]",
    });
  }

  const statuses = Object.values(val.checklist) as Boolean[];
  const hasFail = statuses.some((s) => s === false);
  if (hasFail) {
    ctx.addIssue({
      code: "custom",
      message: 'pass=true requires no checklist item to be "fail"',
    });
  }
}
