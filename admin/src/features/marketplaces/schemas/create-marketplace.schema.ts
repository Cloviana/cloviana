import { z } from 'zod';

export const createMarketplaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a marketplace name.')
    .max(120, 'Use 120 characters or fewer.'),
});

export type CreateMarketplaceInput = z.infer<typeof createMarketplaceSchema>;
