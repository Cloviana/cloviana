import { api } from '@/lib/api-client';

export type AuthAccessResponse = {
  allowed: boolean;
  reason: 'admin' | 'owner' | 'member' | 'invite' | 'denied';
};

export async function checkAuthAccess(email: string) {
  return api.get<AuthAccessResponse>('/auth/access', {
    params: { email: email.trim().toLowerCase() },
  });
}
