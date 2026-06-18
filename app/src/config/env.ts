import * as z from 'zod';
import 'dotenv/config';

const createEnv = () => {
  const EnvSchema = z.object({
    API_URL: z.string(),
    APP_URL: z.string().optional().default('http://localhost:3000'),
    SUPABASE_URL: z.string(),
    SUPABASE_ANON_KEY: z.string(),
    ENVIRONMENT: z
      .enum(['development', 'production'])
      .optional()
      .default('development'),
    GA4_ID: z.string(),
  });

  const envVars = {
    API_URL:
      typeof window === 'undefined' && process.env.INTERNAL_API_URL
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  };

  if (typeof window === 'undefined') {
    console.log('[server] Resolved envVars.API_URL =', envVars.API_URL);
  }

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
