import { z } from 'zod';

import { CURRENCY_CODES } from '../lib/currencies';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Use 254 characters or fewer.')
  .pipe(z.email('Enter a valid email address.'));

export const createStoreRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a store name.')
    .max(100, 'Use 100 characters or fewer.'),
  // Left empty, the API generates the handle from the name.
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Use at least 2 characters.')
    .max(40, 'Use 40 characters or fewer.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and single hyphens.',
    )
    .or(z.literal('').transform(() => undefined))
    .optional(),
  email,
  phone: z
    .string()
    .trim()
    .max(32, 'Use 32 characters or fewer.')
    .transform((value) => value || undefined)
    .optional(),
  currencyCode: z.enum(CURRENCY_CODES),
  adminEmail: email,
});

export type CreateStoreFormInput = z.input<typeof createStoreRequestSchema>;
export type CreateStoreRequest = z.output<typeof createStoreRequestSchema>;
