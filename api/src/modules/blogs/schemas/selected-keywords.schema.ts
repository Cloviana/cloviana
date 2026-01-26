import { z } from "zod";

export const SelectedKeywordsSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      recommended: z.boolean(),
    }),
  ),
});
export type SelectedKeywords = z.infer<typeof SelectedKeywordsSchema>;
