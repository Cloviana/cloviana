import { api } from '@/lib/api-client';

export type AuthAccessResponse = {
  allowed: boolean;
  reason:
    | 'admin'
    | 'owner'
    | 'member'
    | 'invite'
    | 'business_email'
    | 'personal_email'
    | 'denied';
};

export async function checkAuthAccess(email: string) {
  return api.get<AuthAccessResponse>('/auth/access', {
    params: { email: email.trim().toLowerCase() },
  });
}
