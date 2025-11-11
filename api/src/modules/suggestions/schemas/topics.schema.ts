import { z } from "zod";

export const TopicsSchema = z.object({
  topics: z.array(z.string().trim().min(1)).length(5),
});
export type Topics = z.infer<typeof TopicsSchema>;
