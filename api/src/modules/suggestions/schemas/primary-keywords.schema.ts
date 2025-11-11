import { z } from "zod";

export const PrimaryKeywordsSchema = z.object({
  items: z
    .array(
      z.object({
        keyword: z.string().trim().min(1),
        recommended: z.boolean(),
      }),
    )
    .length(12),
});
export type PrimaryKeywords = z.infer<typeof PrimaryKeywordsSchema>;
