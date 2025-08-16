import { z } from "zod";

const WordCount = z
  .object({
    min: z.number().int().positive().describe("Minimum required word count"),
    max: z.number().int().positive().describe("Maximum allowed word count"),
  })
  .refine(({ max, min }) => max >= min, {
    path: ["max"],
    message: "max must be ≥ min",
  })
  .describe("Defines the allowed word‐count range");

const BaseSection = {
  headingText: z.string().min(1).describe("Title of the section"),
  talkingPoints: z.array(z.string().min(1)).min(1).describe("Main points to address in this section"),
  wordCount: WordCount.describe("Word‐count limits for this section"),
  transitionToNext: z.string().nullable().describe("Instructions for transitioning into the next section"),
};

const SubSectionSchema = z
  .object(BaseSection)
  .describe("Schema for a detailed subsection");

const SectionSchema = z
  .object({
    type: z.enum(["INTRODUCTION", "SECTION", "CONCLUSION"]).describe("Section category"),
    ...BaseSection,
    subsections: z.array(SubSectionSchema).nullable().describe("nullable list of subsections"),
  })
  .describe("Schema for a top-level outline section");

const ThumbnailSchema = z
      .object({
        prompt: z.string().min(1).describe("Text prompt to generate the blog’s cover image"),
        altText: z.string().min(1).describe("Descriptive alt text for the cover image"),
      })
      .describe("Settings for the blog’s cover image")

export const OutlineSchema = z
  .object({
    sections: z.array(SectionSchema).min(1).describe("Ordered list of all sections"),
    thumbnail: ThumbnailSchema,
    description: z
      .string()
      .min(1)
      .describe(
        "A preview description of around 150 words summarizing the entire blog post, optimized for search engines"
      ),
  })
  .describe("Complete blog outline with sections, cover image, and SEO preview text");

export type Outline = z.infer<typeof OutlineSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Thumbnail = z.infer<typeof ThumbnailSchema>