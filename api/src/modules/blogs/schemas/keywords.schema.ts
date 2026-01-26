import { z } from "zod";

export const KeywordsSchema = z.object({
  keywords: z.array(z.string()).length(50),
});
export type Keywords = z.infer<typeof KeywordsSchema>;
