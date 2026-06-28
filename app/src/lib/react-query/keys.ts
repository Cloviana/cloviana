export const businessKeys = {
  base: ['businesses'] as const,
  list: () => [...businessKeys.base, 'list'] as const,
  detail: (businessId: string) =>
    [...businessKeys.base, 'detail', businessId] as const,
  competitorSuggestions: (businessId: string) =>
    [...businessKeys.base, 'competitor-suggestions', businessId] as const,
};

export const jobKeys = {
  base: ['jobs'] as const,
  list: () => [...jobKeys.base, 'list'] as const,
  detail: (jobId: string) => [...jobKeys.base, 'detail', jobId] as const,
  status: (jobId: string) => [...jobKeys.base, 'status', jobId] as const,
};
