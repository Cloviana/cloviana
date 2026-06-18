import { z } from 'zod';

import { workEmailSchema } from '@/features/auth/schemas/work-email';

export const BUSINESS_INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'Agency',
  'Fintech',
  'Healthcare',
  'Professional Services',
  'Other',
] as const;

export const startBusinessSetupSchema = z.object({
  workEmail: workEmailSchema,
  brandName: z.string().trim().min(2).max(120),
  domain: z
    .string()
    .trim()
    .regex(
      /^(?!https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      'Enter a valid domain without protocol',
    ),
  location: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1, 'Select a time zone'),
});

const domainSchema = z
  .string()
  .trim()
  .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Enter a valid domain');

export const setupBusinessProfileSchema = z
  .object({
    description: z.string().trim().min(20).max(2000),
    industry: z.enum(BUSINESS_INDUSTRIES),
    category: z.string().trim().min(2).max(160),
    distributionChannels: z
      .string()
      .trim()
      .refine(
        (value) =>
          value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean).length > 0,
        'Select at least one distribution channel',
      ),
    searchIntentCommercial: z.number().min(0).max(100),
    searchIntentInformational: z.number().min(0).max(100),
  })
  .refine(
    (data) =>
      data.searchIntentCommercial + data.searchIntentInformational === 100,
    {
      message: 'Commercial and Informational intent must sum to 100',
      path: ['searchIntentCommercial'],
    },
  );

export const setupBusinessTopicsSchema = z.object({
  topicIds: z.array(z.string()).min(1).max(8),
});

export const approvedPromptSchema = z.object({
  clusterId: z.string(),
  text: z.string().trim().min(8).max(500),
  stage: z.enum(['EXPLORE', 'EVALUATE', 'DECIDE']),
  selected: z.boolean(),
});

export const setupBusinessPromptsSchema = z
  .object({
    prompts: z.array(approvedPromptSchema).max(100),
  })
  .refine(
    (value) => value.prompts.filter((prompt) => prompt.selected).length >= 3,
    {
      message: 'Approve at least 3 prompts',
      path: ['prompts'],
    },
  )
  .refine(
    (value) => value.prompts.filter((prompt) => prompt.selected).length <= 25,
    {
      message: 'You can only approve up to 25 prompts',
      path: ['prompts'],
    },
  );

export const setupBusinessCompetitorsSchema = z.object({
  competitors: z.array(domainSchema).min(3).max(5),
});

export type StartBusinessSetupData = z.infer<typeof startBusinessSetupSchema>;
export type SetupBusinessProfileData = z.infer<
  typeof setupBusinessProfileSchema
>;
export type SetupBusinessTopicsData = z.infer<typeof setupBusinessTopicsSchema>;
export type SetupBusinessPromptsData = z.infer<
  typeof setupBusinessPromptsSchema
>;
export type SetupBusinessCompetitorsData = z.infer<
  typeof setupBusinessCompetitorsSchema
>;
