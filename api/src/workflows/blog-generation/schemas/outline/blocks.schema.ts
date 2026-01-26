import { z } from "zod";

export const TODO = "TODO" as const;

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    goal: z.string().min(1),
    points: z.array(z.string().min(1)).min(1).max(3),
  }),
  z.object({
    type: z.literal("bullets"),
    goal: z.string().min(1),
    points: z.array(z.string().min(1)).min(2).max(6),
  }),
  z.object({
    type: z.literal("numbered"),
    goal: z.string().min(1),
    points: z.array(z.string().min(1)).min(2).max(6),
  }),
]);

export type Block = z.infer<typeof BlockSchema>;
