import {
  ConclusionCtaSectionSchema,
  IntroSectionSchema,
  ObjectionsSectionSchema,
  ProblemSectionSchema,
  ProductRecommendationSectionSchema,
  SolutionFrameworkSectionSchema,
} from "@/workflows/blog-generation/schemas/outline/sections.schema";
import { z } from "zod";

export const ProblemSolutionSectionSchema = z.discriminatedUnion("role", [
  IntroSectionSchema,
  ProblemSectionSchema,
  SolutionFrameworkSectionSchema,
  ProductRecommendationSectionSchema,
  ObjectionsSectionSchema,
  ConclusionCtaSectionSchema,
]);

export type ProblemSolutionSection = z.infer<
  typeof ProblemSolutionSectionSchema
>;
