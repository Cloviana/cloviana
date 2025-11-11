import { z } from "zod";

export const SeedSchema = z.object({
  seed: z
    .string()
    .regex(/^[A-Za-z0-9\s]+$/)
    .min(1),
});
export type Seed = z.infer<typeof SeedSchema>;
