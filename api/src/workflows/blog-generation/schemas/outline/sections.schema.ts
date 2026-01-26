import { ROLE } from "@/workflows/blog-generation/constants/roles.constants";
import { RoleSchema } from "@/workflows/blog-generation/schemas/roles.schema";
import { z } from "zod";
import { BlockSchema } from "./blocks.schema";
import { FeaturedAssetIdsSchema, ImageSchema } from "./image.schema";

export const SubsectionSchema = z.object({
  estimatedWordCount: z.number().int().positive(),
  goal: z.string().min(1),
  blocks: z.array(BlockSchema).min(1).max(6),
});

const BaseSectionSchema = z.object({
  sectionId: z.string().min(1),
  role: RoleSchema,
  estimatedWordCount: z.number().int().positive(),
  goal: z.string().min(1),
  blocks: z.array(BlockSchema).min(1).max(6),
  commerceHookIds: z.array(z.string()).min(0).max(6).default([]),
  subsections: z.array(SubsectionSchema).default([]),
  keywords: z.array(z.string()).default([]),
  heading: z.string().min(1).nullable(),
});

const SectionWithImageSchema = BaseSectionSchema.extend({
  contextualImage: ImageSchema,
});

const SectionWithAssetsSchema = BaseSectionSchema.extend({
  featuredAssetIds: FeaturedAssetIdsSchema,
});

const SectionWithImageAndAssetsSchema = SectionWithImageSchema.extend({
  featuredAssetIds: FeaturedAssetIdsSchema,
});

const IntroSectionSchema = BaseSectionSchema.extend({
  role: z.literal(ROLE.INTRO),
  heading: z.null(),
});

const ProblemSectionSchema = SectionWithImageSchema.extend({
  role: z.literal(ROLE.PROBLEM),
});

const SolutionFrameworkSectionSchema = BaseSectionSchema.extend({
  role: z.literal(ROLE.SOLUTION_FRAMEWORK),
});

const ProductRecommendationSectionSchema =
  SectionWithImageAndAssetsSchema.extend({
    role: z.literal(ROLE.PRODUCT_RECOMMENDATION),
  });

const ObjectionsSectionSchema = SectionWithAssetsSchema.extend({
  role: z.literal(ROLE.OBJECTIONS),
});

const ConclusionCtaSectionSchema = SectionWithAssetsSchema.extend({
  role: z.literal(ROLE.CONCLUSION_CTA),
});

const SharedBaselineSectionSchema = BaseSectionSchema.extend({
  role: z.literal(ROLE.SHARED_BASELINE),
});

const OptionAAnalysisSectionSchema = SectionWithImageSchema.extend({
  role: z.literal(ROLE.OPTION_A_ANALYSIS),
});

const OptionBAnalysisSectionSchema = SectionWithImageSchema.extend({
  role: z.literal(ROLE.OPTION_B_ANALYSIS),
});

const DecisionAndRecommendationSectionSchema = SectionWithAssetsSchema.extend({
  role: z.literal(ROLE.DECISION_AND_RECOMMENDATION),
});

const WhoShouldChooseSectionSchema = BaseSectionSchema.extend({
  role: z.literal(ROLE.WHO_SHOULD_CHOOSE),
});

export {
  BaseSectionSchema,
  SectionWithImageSchema,
  SectionWithAssetsSchema,
  SectionWithImageAndAssetsSchema,
  IntroSectionSchema,
  ProblemSectionSchema,
  SolutionFrameworkSectionSchema,
  ProductRecommendationSectionSchema,
  ObjectionsSectionSchema,
  ConclusionCtaSectionSchema,
  SharedBaselineSectionSchema,
  OptionAAnalysisSectionSchema,
  OptionBAnalysisSectionSchema,
  WhoShouldChooseSectionSchema,
  DecisionAndRecommendationSectionSchema,
};
