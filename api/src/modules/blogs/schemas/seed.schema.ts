import { z } from "zod";

export const SeedSchema = z.object({
  seeds: z
    .array(z.string().regex(/^[A-Za-z0-9\s]+$/).min(1))
    .min(1)
    .max(3),
});

export type Seeds = z.infer<typeof SeedSchema>;
