import type { PromptAwarenessStage } from '@/features/monitoring/types';
import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type SetupClientRequest = {
  email: string;
  password: string;
  brandName: string;
  domain: string;
  profileUrl?: string;
  location: string;
  timezone: string;
  description: string;
  industry:
    | 'SaaS'
    | 'E-commerce'
    | 'Agency'
    | 'Fintech'
    | 'Healthcare'
    | 'Professional Services'
    | 'Other';
  category: string;
  distributionChannels: string[];
  searchIntentCommercial: number;
  searchIntentInformational: number;
  competitors: Array<{ name: string; domain: string }>;
  topics: Array<{
    name: string;
    prompts: Array<{ text: string; stage: PromptAwarenessStage }>;
  }>;
};

export type SetupClientResponse = {
  client: {
    email: string;
    password: string;
    userId: string;
  };
  business: {
    id: string;
    name: string;
    domain: string;
  };
  counts: {
    competitors: number;
    topics: number;
    prompts: number;
  };
  monitoring: {
    jobId: string | null;
    enqueued: boolean;
    reason: string;
    error?: string;
  };
  dashboardPath: string;
};

export async function setupClient(payload: SetupClientRequest) {
  const headers = await getAuthHeaders();
  return api.post<SetupClientResponse>('/admin/setup-client', payload, {
    headers,
  });
}
