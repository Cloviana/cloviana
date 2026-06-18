import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type {
  AiEngine,
  DomainType,
  MonitoringRange,
  PaginatedResponse,
  SourceOwnerType,
} from '../types';

export type GapBreakdown = {
  name: string;
  domain: string;
  isSelf: boolean;
  mentionRate: number;
  citationShare: number;
  sov: number;
};

export type MonitoringGapResponse = {
  trend: Record<string, any>[];
  breakdown: GapBreakdown[];
};

export const getMonitoringGap = async (
  businessId: string,
  params: { range?: MonitoringRange } = {},
): Promise<MonitoringGapResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringGapResponse>(
    `/businesses/${businessId}/monitoring/gap`,
    { headers, params },
  );
};

export const useMonitoringGap = (
  businessId: string,
  params: { range?: MonitoringRange } = {},
) => {
  return useQuery({
    queryKey: ['monitoring', 'gap', businessId, params],
    queryFn: () => getMonitoringGap(businessId, params),
  });
};

export type SourceGapKind = 'domains' | 'hosts' | 'urls';

export type MonitoringSourceGap = {
  key: string;
  source: string;
  domain: string;
  url: string | null;
  title: string | null;
  urlType: string | null;
  domainType: DomainType;
  ownerType: SourceOwnerType;
  competitors: string[];
  mentions: number;
  retrievals: number;
  citationRate: number;
  gapScore: number;
  engines: AiEngine[];
};

export type MonitoringSourceGapsParams = {
  kind: SourceGapKind;
  engine?: AiEngine | 'ALL';
  range?: MonitoringRange;
  page?: number;
  limit?: number;
  search?: string;
  type?: DomainType | 'ALL';
  urlType?: string | 'ALL';
  minCompetitors?: number;
};

export type MonitoringSourceGapsResponse =
  PaginatedResponse<MonitoringSourceGap> & {
    kind: SourceGapKind;
  };

export const getMonitoringSourceGaps = async (
  businessId: string,
  params: MonitoringSourceGapsParams,
): Promise<MonitoringSourceGapsResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringSourceGapsResponse>(
    `/businesses/${businessId}/monitoring/gap`,
    { headers, params },
  );
};

export const useMonitoringSourceGaps = (
  businessId: string,
  params: MonitoringSourceGapsParams,
) => {
  return useQuery({
    queryKey: ['monitoring', 'source-gaps', businessId, params],
    queryFn: () => getMonitoringSourceGaps(businessId, params),
    enabled: Boolean(businessId),
  });
};
