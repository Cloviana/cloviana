import { z } from "zod";

export const AssetSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
  id: z.string(),
  imageUrl: z.string().optional(),
});

export const ContextSchema = z.object({
  core: z.object({
    topic: z.string(),
    wordCountRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
  }),
  seo: z.object({
    primaryKeyword: z.string(),
    secondaryKeywords: z.array(z.string()),
  }),
  brand: z.object({
    name: z.string(),
    description: z.string(),
    voice: z.string(),
  }),
  referenceMaterial: z.object({
    products: z.array(AssetSchema),
    collections: z.array(AssetSchema),
  }),
});

export type Context = z.infer<typeof ContextSchema>;