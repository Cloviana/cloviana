import * as z from 'zod';
import 'dotenv/config';

const createEnv = () => {
  const EnvSchema = z.object({
    APP_URL: z.string().optional().default('http://app.localhost'),
    WEB_URL: z.string().optional().default('http://localhost'),
    ENVIRONMENT: z
      .enum(['development', 'production'])
      .optional()
      .default('development'),
    GA4_ID: z.string().optional().default('G-XXXXXXX'),
    CLARITY_PROJECT_ID: z.string().optional(),
    API_URL: z.string().optional().default('http://localhost:3001'),
  });

  const envVars = {
    ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
    API_URL:
      typeof window === 'undefined' && process.env.INTERNAL_API_URL
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL,
  };

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
  The following variables are missing or invalid:
  ${Object.entries(parsedEnv.error.flatten().fieldErrors)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')}
  `,
    );
  }

  return parsedEnv.data ?? {};
};

export const env = createEnv();
