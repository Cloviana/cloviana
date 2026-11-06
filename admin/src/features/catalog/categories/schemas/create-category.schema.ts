import { z } from 'zod';

// Empty optional fields arrive as '' from forms; treat them as omitted.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .transform((value) => value || undefined)
    .optional();

export const createCategoryRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a category name.')
    .max(100, 'Use 100 characters or fewer.'),
  handle: z
    .string()
    .trim()
    .max(120, 'Use 120 characters or fewer.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and hyphens.',
    )
    .or(z.literal('').transform(() => undefined))
    .optional(),
  parentId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? undefined),
  description: optionalText(1000),
  isActive: z.boolean().default(true),
  isInternal: z.boolean().default(false),
});

export type CreateCategoryFormInput = z.input<
  typeof createCategoryRequestSchema
>;
export type CreateCategoryRequest = z.output<
  typeof createCategoryRequestSchema
>;
