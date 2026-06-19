import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type DomainType =
  | 'CORPORATE'
  | 'REFERENCE'
  | 'INSTITUTIONAL'
  | 'EDITORIAL'
  | 'UGC'
  | 'OTHER';

export type TopDomain = {
  domain: string;
  retrievals: number;
  retrieved: number; // percentage
  citationRate: number;
  type: DomainType;
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

export type MonitoringDomainsResponse = {
  totalPrompts: number;
  totalRetrievals: number;
  topDomains: TopDomain[];
  domainTypes: DomainTypeDist[];
  domainMovers: DomainMovers;
};

export const getMonitoringDomains = async (
  businessId: string,
): Promise<MonitoringDomainsResponse> => {
  const headers = await getAuthHeaders();
  return api.get<MonitoringDomainsResponse>(
    `/businesses/${businessId}/monitoring/domains`,
    { headers },
  );
};

export const useMonitoringDomains = (businessId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'domains', businessId],
    queryFn: () => getMonitoringDomains(businessId),
  });
};
