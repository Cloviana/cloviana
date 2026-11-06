import { z } from 'zod';

// The form requires a name; skipping goes through the action without one.
export const marketplaceFormSchema = z.object({
  marketplaceName: z
    .string()
    .trim()
    .min(1, 'Enter a marketplace name.')
    .max(120, 'Use 120 characters or fewer.'),
});

export type MarketplaceFormValues = z.infer<typeof marketplaceFormSchema>;
