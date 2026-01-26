import {
  TEMPLATE_ROLE_SEQUENCES,
  TemplateId,
} from "@/workflows/blog-generation/constants/roles.constants";
import { z } from "zod";
import { ThumbnailSchema } from "./image.schema";
import { ComparisonSectionSchema } from "./sections.comparison.schema";
import { ProblemSolutionSectionSchema } from "./sections.problem-solution.schema";

export const MetaDataSchema = z.object({
  description: z.string(),
});

const BaseOutlineSchema = z.object({
  title: z.string().min(1),
  metaData: MetaDataSchema,
  thumbnail: ThumbnailSchema,
});

export const ProblemSolutionOutlineSchema = BaseOutlineSchema.extend({
  templateId: z.literal("problem-solution"),
  sections: z
    .array(ProblemSolutionSectionSchema)
    .length(TEMPLATE_ROLE_SEQUENCES["problem-solution"].length),
});

export const ComparisonOutlineSchema = BaseOutlineSchema.extend({
  templateId: z.literal("comparison"),
  sections: z
    .array(ComparisonSectionSchema)
    .length(TEMPLATE_ROLE_SEQUENCES["comparison"].length),
});

export const OutlineSchema = z.discriminatedUnion("templateId", [
  ProblemSolutionOutlineSchema,
  ComparisonOutlineSchema,
]);

export type ProblemSolutionOutline = z.infer<
  typeof ProblemSolutionOutlineSchema
>;
export type ComparisonOutline = z.infer<typeof ComparisonOutlineSchema>;
export type Outline = z.infer<typeof OutlineSchema>;

export function getOutlineSchemaForTemplateId(templateId: TemplateId) {
  return templateId === "comparison"
    ? ComparisonOutlineSchema
    : ProblemSolutionOutlineSchema;
}
