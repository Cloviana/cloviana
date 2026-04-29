export const jobsKeys = {
  all: ['jobs'] as const,
  list: (businessId: string) => [...jobsKeys.all, businessId] as const,
  detail: (businessId: string, jobId: string) =>
    [...jobsKeys.all, businessId, jobId] as const,
  latest: (businessId: string, type: string) =>
    [...jobsKeys.all, businessId, 'latest', type] as const,
  latestStatus: (businessId: string, type: string) =>
    [...jobsKeys.all, businessId, 'latest-status', type] as const,
};
