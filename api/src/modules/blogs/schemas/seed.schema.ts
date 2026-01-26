import { z } from "zod";

export const SeedSchema = z.object({
  seeds: z
    .array(
      z
        .string()
        .regex(/^[A-Za-z0-9\s]+$/)
        .min(1),
    )
    .length(10),
});

export type Seeds = z.infer<typeof SeedSchema>;
