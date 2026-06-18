import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type {
  AiEngine,
  DomainType,
  MonitoringRange,
  MonitoringSourceSeries,
  MonitoringTrendPoint,
  SourceOwnerType,
} from '../types';

export type { DomainType };

export type SourcePrompt = { id: string; text: string; count: number };

export type TopDomain = {
  key: string;
  source: string;
  domain: string;
  url: string | null;
  title: string | null;
  urlType: string | null;
  ownerType: SourceOwnerType;
  competitorName: string | null;
  retrievals: number;
  retrieved: number;
  citationRate: number;
  citationCount: number;
  type: DomainType;
  engines: AiEngine[];
  prompts: SourcePrompt[];
};

export type DomainTypeDist = {
  type: DomainType;
  percentage: number;
  count: number;
};

export type DomainMovers = {
  top: TopDomain[];
  new: TopDomain[];
  trending: TopDomain[];
  losing: TopDomain[];
};

export type SourceOverviewParams = {
  engine?: AiEngine | 'ALL';
  range?: MonitoringRange;
  page?: number;
  limit?: number;
  search?: string;
  type?: DomainType | 'ALL';
  urlType?: string | 'ALL';
  owner?: SourceOwnerType | 'ALL';
};

export type MonitoringDomainsResponse = {
  kind: 'domains' | 'hosts' | 'urls';
  range: MonitoringRange;
  totalPrompts: number;
  totalResponses: number;
  totalRetrievals: number;
  totalCitations: number;
  items: TopDomain[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  topDomains: TopDomain[];
  series: MonitoringSourceSeries[];
  trend: MonitoringTrendPoint[];
  domainTypes: DomainTypeDist[];
  domainMovers: DomainMovers;
};

export const getMonitoringDomains = async (
  businessId: string,
  params: SourceOverviewParams = {},
): Promise<MonitoringDomainsResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringDomainsResponse>(
    `/businesses/${businessId}/monitoring/domains`,
    {
      headers,
      params,
    },
  );
};

export const useMonitoringDomains = (
  businessId: string,
  params: SourceOverviewParams = {},
) => {
  return useQuery({
    queryKey: ['monitoring', 'domains', businessId, params],
    queryFn: () => getMonitoringDomains(businessId, params),
    enabled: Boolean(businessId),
  });
};

export const getMonitoringHosts = async (
  businessId: string,
  params: SourceOverviewParams = {},
): Promise<MonitoringDomainsResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringDomainsResponse>(
    `/businesses/${businessId}/monitoring/hosts`,
    {
      headers,
      params,
    },
  );
};

export const useMonitoringHosts = (
  businessId: string,
  params: SourceOverviewParams = {},
) => {
  return useQuery({
    queryKey: ['monitoring', 'hosts', businessId, params],
    queryFn: () => getMonitoringHosts(businessId, params),
    enabled: Boolean(businessId),
  });
};
