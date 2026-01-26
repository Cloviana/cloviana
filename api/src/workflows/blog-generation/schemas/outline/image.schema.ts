import { z } from "zod";

export const ImageIntentSchema = z.enum([
  "thumbnail",
  "problem",
  "product_recommendation",
  "comparison_product",
]);

export const ImageAngleSchema = z.enum([
  "front",
  "three_quarter",
  "side",
  "top_down",
  "macro_closeup",
]);

export const ImageSchema = z.object({
  intent: ImageIntentSchema,
  sceneDescription: z.string().min(1),
  angle: ImageAngleSchema,
  referencedAssetIds: z.array(z.string()).max(3).nullable(),
  altText: z.string().min(1),
  url: z.string().nullable(),
});

export const ThumbnailSchema = ImageSchema;

export const FeaturedAssetIdsSchema = z.array(z.string()).min(1);
