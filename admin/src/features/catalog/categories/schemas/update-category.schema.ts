import { z } from 'zod';

// The category form's fields. Empty optional text arrives as '' from the form and is treated as omitted.
export const updateCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a category name.')
    .max(100, 'Use 100 characters or fewer.'),
  handle: z
    .string()
    .trim()
    .min(1, 'Enter a URL handle.')
    .max(120, 'Use 120 characters or fewer.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and hyphens.',
    ),
  parentId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  description: z
    .string()
    .trim()
    .max(1000, 'Use 1000 characters or fewer.')
    .transform((value) => value || null)
    .nullish()
    .transform((value) => value ?? null),
  isActive: z.boolean(),
  isInternal: z.boolean(),
});

export type UpdateCategoryFormInput = z.input<typeof updateCategoryFormSchema>;
export type UpdateCategoryFormValues = z.output<
  typeof updateCategoryFormSchema
>;

// What goes to the API: the form's fields plus the version the editor loaded.
export const updateCategoryRequestSchema = updateCategoryFormSchema.extend({
  expectedUpdatedAt: z.string().min(1),
});

export type UpdateCategoryRequest = z.output<
  typeof updateCategoryRequestSchema
>;
