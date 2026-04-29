import type { BusinessEntry } from '@/features/businesses/types';
import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export const getBusinessEntry = async (): Promise<BusinessEntry> => {
  const headers = await getAuthHeaders();
  return api.get<BusinessEntry>('/businesses/entry', { headers });
};
