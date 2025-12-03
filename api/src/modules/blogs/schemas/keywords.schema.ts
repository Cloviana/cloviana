import { z } from "zod";

export const KeywordsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number(),
        recommended: z.boolean(),
      }),
    )
});
export type PrimaryKeywords = z.infer<typeof KeywordsSchema>;
