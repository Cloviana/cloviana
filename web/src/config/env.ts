import * as z from 'zod';
import 'dotenv/config';

const createEnv = () => {
  const EnvSchema = z.object({
    APP_URL: z.string().optional().default('http://dashboard.localhost'),
    WEB_URL: z.string().optional().default('http://localhost'),
    ENVIRONMENT: z
      .enum(['development', 'production'])
      .optional()
      .default('development'),
  });

  const envVars = {
    ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
