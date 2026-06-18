import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  businesses: Array<{
    id: string;
    name: string;
    domain: string;
    status: string;
    monitoringEnabled: boolean;
    promptCount: number;
  }>;
};

export async function getAdminUsers(
  search?: string,
): Promise<AdminUser[]> {
  const headers = await getAuthHeaders();
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return api.get<AdminUser[]>(`/admin/users${params}`, { headers });
}

export async function deleteAdminUser(
  profileId: string,
): Promise<{ deleted: boolean; email: string }> {
  const headers = await getAuthHeaders();
  return api.delete<{ deleted: boolean; email: string }>(
    `/admin/users/${profileId}`,
    { headers },
  );
}

export async function toggleMonitoring(
  businessId: string,
  enabled: boolean,
): Promise<{ success: boolean; monitoringEnabled: boolean }> {
  const headers = await getAuthHeaders();
  return api.patch<{ success: boolean; monitoringEnabled: boolean }>(
    `/admin/businesses/${businessId}/monitoring`,
    { enabled },
    { headers },
  );
}
