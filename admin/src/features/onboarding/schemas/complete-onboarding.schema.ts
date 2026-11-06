import { z } from 'zod';

// Omit marketplaceName to skip creating a marketplace.
export const completeOnboardingSchema = z.object({
  marketplaceName: z
    .string()
    .trim()
    .min(1, 'Enter a marketplace name.')
    .max(120, 'Use 120 characters or fewer.')
    .optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
