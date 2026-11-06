'use server';

import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

import { completeOnboarding } from '../api/complete-onboarding';
import { completeOnboardingSchema } from '../schemas/complete-onboarding.schema';

export type CompleteOnboardingResult = { success: false; message: string };

// Only returns on failure; success redirects into the dashboard.
export async function completeOnboardingAction(
  input: unknown,
): Promise<CompleteOnboardingResult> {
  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid marketplace name.',
    };
  }

  try {
    await completeOnboarding(parsed.data);
  } catch {
    return { success: false, message: 'Could not finish setup. Try again.' };
  }

  redirect(paths.home.getHref());
}
