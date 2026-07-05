export const businessKeys = {
  base: ['businesses'] as const,
  list: () => [...businessKeys.base, 'list'] as const,
  detail: (businessId: string) =>
    [...businessKeys.base, 'detail', businessId] as const,
  competitorSuggestions: (businessId: string) =>
    [...businessKeys.base, 'competitor-suggestions', businessId] as const,
};

export const documentKeys = {
  base: ['documents'] as const,
  list: (businessId: string) =>
    [...documentKeys.base, 'list', businessId] as const,
  detail: (businessId: string, documentId: string) =>
    [...documentKeys.base, 'detail', businessId, documentId] as const,
};

export const chatKeys = {
  base: ['chats'] as const,
  list: (businessId: string) => [...chatKeys.base, 'list', businessId] as const,
  detail: (businessId: string, chatId: string) =>
    [...chatKeys.base, 'detail', businessId, chatId] as const,
};

export const jobKeys = {
  base: ['jobs'] as const,
  list: (businessId?: string) =>
    [...jobKeys.base, 'list', ...(businessId ? [businessId] : [])] as const,
  detail: (jobId: string) => [...jobKeys.base, 'detail', jobId] as const,
  status: (jobId: string) => [...jobKeys.base, 'status', jobId] as const,
};

export const blogKeys = {
  base: ['blogs'] as const,
  drafts: (businessId: string) =>
    [...blogKeys.base, 'drafts', businessId] as const,
  draft: (businessId: string, draftId: string) =>
    [...blogKeys.base, 'draft', businessId, draftId] as const,
};

export const cmsKeys = {
  base: ['cms'] as const,
  connections: (businessId: string) =>
    [...cmsKeys.base, 'connections', businessId] as const,
};
