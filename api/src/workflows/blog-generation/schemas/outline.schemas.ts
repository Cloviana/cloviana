import { z } from "zod";
import { HeadingNodeSchema } from "./node.schemas";


export const StructureSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraphs"), minParagraphs: z.number().int().min(1) }),
  z.object({ type: z.literal("bulleted_list"), minItems: z.number().int().min(2), maxItems: z.number().int().nullable() }),
  z.object({ type: z.literal("steps"), minItems: z.number().int().min(2), maxItems: z.number().int().nullable() }),
]);

export const SectionSchema = z.object({
  heading: HeadingNodeSchema,
  goal: z.string().min(1),
  mustCover: z.array(z.string().min(1)).min(1),
  structure: StructureSchema,
  wordTarget: z.number().int().min(120),
  role: z.enum(["intro","body","how_to","list","cta","conclusion"]),
  seo: z.object({
    keywordDensity: z.number().min(0).max(1),
    requireExact: z.boolean()
  }).nullable(),
});

export const ThumbnailSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .describe("Text prompt to generate the blog’s cover image"),
  altText: z
    .string()
    .min(1)
    .describe("Descriptive alt text for the cover image"),
});

export type Section = z.infer<typeof SectionSchema>;
export type Thumbnail = z.infer<typeof ThumbnailSchema>;
