import { z } from "zod";

export const WordCount = z
  .object({
    min: z.number().int().positive().describe("Minimum required word count"),
    max: z.number().int().positive().describe("Maximum allowed word count"),
  })
  .refine(({ max, min }) => max >= min, {
    path: ["max"],
    message: "max must be ≥ min",
  })
  .describe("Defines the allowed word‐count range");

export const WritingGuideSchema = z.object({
  objective: z.string().min(1).describe("What this section must achieve"),
  angle: z.string().nullable().describe("Chosen framing or POV"),
  voice: z.string().nullable().describe("Tone/voice overrides if any"),
  do: z
    .array(z.string().min(1))
    .nullable()
    .describe("Positive directives for the section to follow"),
  avoid: z
    .array(z.string().min(1))
    .nullable()
    .describe("Pitfalls or constraints that section should avoid"),
});

export const SeoSchema = z.object({
  keywordDensity: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Desired density for the primary keyword in this section; 0 allows skipping",
    ),
});

export const SectionSchema = z.object({
  headingId: z.string().describe("The id of the heading described"),
  wordCount: WordCount,
  talkingPoints: z
    .array(z.string().min(1))
    .min(1)
    .describe("Main points to address"),
  guide: WritingGuideSchema.describe("How to write the section"),
  seo: SeoSchema.nullable(),
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

export type WritingGuide = z.infer<typeof WritingGuideSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Thumbnail = z.infer<typeof ThumbnailSchema>;
