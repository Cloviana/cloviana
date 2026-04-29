import z from 'zod';

export const startBusinessSetupSchema = z.object({
  domain: z
    .string()
    .trim()
    .regex(
      /^(?!https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      'Enter a valid domain without protocol',
    ),
});

const domainSchema = z
  .string()
  .trim()
  .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Enter a valid domain');

export const setupBusinessCompetitorsSchema = z.object({
  competitors: z.array(domainSchema).min(3).max(5),
});

export const setupBusinessAttributionSchema = z.object({
  heardAboutUs: z.string().trim().min(2).max(160),
});

export type StartBusinessSetupData = z.infer<typeof startBusinessSetupSchema>;
export type SetupBusinessCompetitorsData = z.infer<
  typeof setupBusinessCompetitorsSchema
>;
export type SetupBusinessAttributionData = z.infer<
  typeof setupBusinessAttributionSchema
>;
