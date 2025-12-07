import { AssetSchema } from "../schemas/context.schema";
import { z } from "zod";

const MetaDataSchema = z.object({
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
});

const SubsectionSchema = z.object({
  heading: z.string().min(1),
  wordBudget: z.number().int().positive().optional(),
  talkingPoints: z.array(z.string()).default([]),
});

const IntroductionSchema = z.object({
  wordBudget: z.number().int().positive().optional(),
  talkingPoints: z.array(z.string()).default([]),
});

const ConclusionSchema = z.object({
  heading: z.string().min(1),
  wordBudget: z.number().int().positive().optional(),
  talkingPoints: z.array(z.string()).default([]),
});

const SectionSchema = z.object({
  heading: z.string().min(1),
  wordBudget: z.number().int().positive().optional(),
  talkingPoints: z.array(z.string()).default([]),
  subsections: z.array(SubsectionSchema).default([]),
});

export const ThumbnailSchema = z.object({
  prompt: z.string().min(1),
  altText: z.string().min(1),
  assets: z.array(z.object({ imageUrl: z.string(), title: z.string() })).max(3).optional()
});

export const OutlineSchema = z.object({
  title: z.string().min(1),
  metaData: MetaDataSchema,
  introduction: IntroductionSchema,
  sections: z.array(SectionSchema).min(1),
  conclusion: ConclusionSchema,
  thumbnail: ThumbnailSchema
});

export type Outline = z.infer<typeof OutlineSchema>;