import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export const markLastAccessedBusiness = async (businessId: string) => {
  const headers = await getAuthHeaders();
  return api.patch<{ ok: true }>(
    `/businesses/${businessId}/last-accessed`,
    undefined,
    { headers },
  );
};
