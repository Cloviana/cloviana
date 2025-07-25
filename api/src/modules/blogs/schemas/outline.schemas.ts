import { z } from "zod";

const ThumbnailSchema = z.object({
  prompt: z.string().min(1),
  altText: z.string().min(1),
});

const WordCountSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .refine((o) => o.max >= o.min, {
    message: "max must be ≥ min",
    path: ["max"],
  });

const SubSectionSchema = z.object({
  headingText: z.string(),
  talkingPoints: z.array(z.string()).min(1),
  wordCount: WordCountSchema,
  transitionToNext: z.string().nullable(),
});

export const SectionSchema = z.object({
  type: z.enum(["INTRODUCTION", "SECTION", "CONCLUSION"]),
  headingText: z.string(),
  talkingPoints: z.array(z.string()).min(1),
  wordCount: WordCountSchema,
  transitionToNext: z.string().nullable(),
  subsections: z.array(SubSectionSchema).nullable(),
});

export const OutlineSchema = z.object({
  sections: z.array(SectionSchema).min(1),
  thumbnail: ThumbnailSchema,
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z-]+$/,
      "slug must contain only lowercase letters, numbers, and dashes",
    ),
  description: z.string().min(1),
});

export type Outline = z.infer<typeof OutlineSchema>;
export type Section = z.infer<typeof SectionSchema>;
