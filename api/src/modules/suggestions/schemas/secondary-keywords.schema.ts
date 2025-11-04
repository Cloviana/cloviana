import { z } from "zod";

export const SecondaryKeywordsSchema = z.object({
  items: z
    .array(
      z.object({
        keyword: z.string().trim().min(1),
        recommended: z.boolean(),
      })
    )
    .length(30),
});
export type SecondaryKeywords = z.infer<typeof SecondaryKeywordsSchema>;