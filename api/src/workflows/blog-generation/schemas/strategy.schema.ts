import { z } from "zod";

export const AssetTypeSchema = z.enum(["product", "collection"]);

export const SearchIntentSchema = z.enum(["commercial", "mixed"]);

export const PrimaryGoalSchema = z.enum(["product_click", "collection_click"]);

export const ConversionObjectionSchema = z.enum([
  "fit",
  "effectiveness",
  "trust",
]);

export const CtaStyleSchema = z.enum(["soft", "direct", "bundle", "quiz"]);

export const CommerceHookSchema = z.object({
  id: z.string(),
  assetType: AssetTypeSchema,
  assetId: z.string(),
  positioning: z.string(),
  featureToHighlight: z.string(),
  benefitToEmphasize: z.string(),
  objectionToAddress: ConversionObjectionSchema,
  ctaStyle: CtaStyleSchema,
});

export const AudienceSchema = z.object({
  who: z.string().min(1),

  painPoints: z.array(z.string().min(1)).min(1).max(5),

  awarenessLevel: z.enum(["problem_aware", "solution_aware"]),

  sophistication: z.enum(["beginner", "intermediate", "expert"]),

  primaryObjections: z.array(ConversionObjectionSchema).min(1).max(3),
});

export const ContentStrategySchema = z.object({
  audience: AudienceSchema,
  keyMessage: z.string().min(1),
  searchIntent: SearchIntentSchema,
  primaryGoal: PrimaryGoalSchema,
  commerceHooks: z.array(CommerceHookSchema).min(1).max(6),
});

export type ContentStrategy = z.infer<typeof ContentStrategySchema>;
