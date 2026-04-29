import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const getAuthHeaders = async () => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }

  return { Authorization: `Bearer ${token}` };
};
