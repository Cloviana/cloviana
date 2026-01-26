import { TemplateIdSchema } from "@/workflows/blog-generation/schemas/roles.schema";
import { z } from "zod";

export const ConversionGoalSchema = z.enum(["product_click"]);
export const ConversionObjectionSchema = z.enum([
  "fit",
  "effectiveness",
  "trust",
]);
export const CtaStyleSchema = z.enum(["soft", "direct"]);
export const SophisticationSchema = z.enum([
  "beginner",
  "intermediate",
  "expert",
]);

export const TODO = "TODO" as const;

export const CommerceHookSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  featureToHighlight: z.string().min(1),
  benefitToEmphasize: z.string().min(1),
  objectionToAddress: ConversionObjectionSchema,
  ctaStyle: CtaStyleSchema,
});

export const AudienceSchema = z.object({
  persona: z.string().min(1),
  painPoints: z.array(z.string().min(1)).min(1).max(5),
  sophistication: SophisticationSchema,
  primaryObjections: z.array(ConversionObjectionSchema).min(1).max(3),
});

const StrategyBaseSchema = z.object({
  audience: AudienceSchema,
  keyMessage: z.string().min(1),
  primaryGoal: ConversionGoalSchema,
  commerceHooks: z.array(CommerceHookSchema).min(1).max(6),
});

export const ProblemSolutionStrategySchema = StrategyBaseSchema.extend({
  templateId: z.literal("problem-solution"),
  featuredProductId: z.string().min(1),
});

const ComparisonAxisTypeSchema = z.enum([
  "ingredients",
  "materials",
  "formats",
  "methods",
]);

const ComparisonOptionSchema = z.object({
  label: z.string().min(1),
  notes: z.array(z.string().min(1)).max(3),
});

export const ComparisonStrategySchema = StrategyBaseSchema.extend({
  templateId: z.literal("comparison"),
  featuredProductIds: z.array(z.string().min(1)).min(1).max(2),
  comparison: z.object({
    axisType: ComparisonAxisTypeSchema,
    optionA: ComparisonOptionSchema,
    optionB: ComparisonOptionSchema,
    sharedBaselineFocus: z.array(z.string().min(1)).min(2).max(5),
    decisionHinge: z.string().min(1),
    decisionLenses: z.array(z.string().min(1)).min(1).max(3),
  }),
});

export const ContentStrategySchema = z.discriminatedUnion("templateId", [
  ProblemSolutionStrategySchema,
  ComparisonStrategySchema,
]);

export type ContentStrategy = z.infer<typeof ContentStrategySchema>;

type CreateStrategySkeletonArgs =
  | {
      templateId: "problem-solution";
      featuredProductId: string;
    }
  | {
      templateId: "comparison";
      featuredProductIds: string[];
    };

function makeHook(args: { id: string; productId: string }) {
  return {
    id: args.id,
    productId: args.productId,
    featureToHighlight: TODO,
    benefitToEmphasize: TODO,
    objectionToAddress: TODO,
    ctaStyle: TODO,
  } as const;
}

export function createStrategySkeleton(args: CreateStrategySkeletonArgs) {
  if (args.templateId === "comparison") {
    const featured = args.featuredProductIds.slice(0, 2);

    const hooks =
      featured.length === 1
        ? [
            makeHook({ id: "cmp_1", productId: featured[0]! }),
            makeHook({ id: "cmp_2", productId: featured[0]! }),
            makeHook({ id: "cmp_3", productId: featured[0]! }),
          ]
        : [
            makeHook({ id: "cmp_1", productId: featured[0]! }),
            makeHook({ id: "cmp_2", productId: featured[0]! }),
            makeHook({ id: "cmp_3", productId: featured[1]! }),
            makeHook({ id: "cmp_4", productId: featured[1]! }),
          ];

    return {
      templateId: "comparison",
      audience: {
        persona: TODO,
        painPoints: [TODO],
        sophistication: "beginner",
        primaryObjections: [TODO],
      },
      keyMessage: TODO,
      primaryGoal: "product_click",
      commerceHooks: hooks,
      featuredProductIds: featured,
      comparison: {
        axisType: TODO,
        optionA: TODO,
        optionB: TODO,
        sharedBaselineFocus: TODO,
        decisionHinge: TODO,
        decisionLenses: TODO,
      },
    } as const;
  }

  return {
    templateId: "problem-solution",
    audience: {
      persona: TODO,
      painPoints: [TODO],
      sophistication: "beginner",
      primaryObjections: [TODO],
    },
    keyMessage: TODO,
    primaryGoal: "product_click",
    featuredProductId: args.featuredProductId,
    commerceHooks: [
      makeHook({ id: "ps_1", productId: args.featuredProductId }),
      makeHook({ id: "ps_2", productId: args.featuredProductId }),
      makeHook({ id: "ps_3", productId: args.featuredProductId }),
    ],
  } as const;
}

export function getStrategySchemaForTemplateId(
  templateId: z.infer<typeof TemplateIdSchema>,
) {
  switch (templateId) {
    case "problem-solution":
      return ProblemSolutionStrategySchema;
    case "comparison":
      return ComparisonStrategySchema;
  }
}
