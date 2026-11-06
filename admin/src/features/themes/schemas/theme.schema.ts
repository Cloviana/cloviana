import { z } from 'zod';

export const themeNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a theme name.')
  .max(100, 'Use 100 characters or fewer.');

// Left empty, the API names the theme.
export const createThemeRequestSchema = z.object({
  name: themeNameSchema.optional(),
});

export const updateThemeRequestSchema = z.object({
  name: themeNameSchema.optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const createThemeVersionRequestSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Enter a label.')
    .max(100, 'Use 100 characters or fewer.')
    .optional(),
});

export type CreateThemeRequest = z.output<typeof createThemeRequestSchema>;
export type UpdateThemeRequest = z.output<typeof updateThemeRequestSchema>;
export type CreateThemeVersionRequest = z.output<
  typeof createThemeVersionRequestSchema
>;
