import {
  DecisionAndRecommendationSectionSchema,
  IntroSectionSchema,
  OptionAAnalysisSectionSchema,
  OptionBAnalysisSectionSchema,
  SharedBaselineSectionSchema,
  WhoShouldChooseSectionSchema,
} from "@/workflows/blog-generation/schemas/outline/sections.schema";
import { z } from "zod";

export const ComparisonSectionSchema = z.discriminatedUnion("role", [
  IntroSectionSchema,
  SharedBaselineSectionSchema,
  OptionBAnalysisSectionSchema,
  OptionAAnalysisSectionSchema,
  DecisionAndRecommendationSectionSchema,
  WhoShouldChooseSectionSchema,
]);

export type ComparisonSection = z.infer<typeof ComparisonSectionSchema>;
