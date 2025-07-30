import { createClient } from './server';

export class SupabaseAuthError extends Error {}
export class MissingCodeError extends SupabaseAuthError {}

export async function handleCallback(code?: string): Promise<void> {
  if (!code) {
    throw new MissingCodeError('No code provided in callback');
  }

  const supabase = await createClient();
  const { data: session, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !session) {
    throw new SupabaseAuthError('Failed to exchange code for session');
  }
}
