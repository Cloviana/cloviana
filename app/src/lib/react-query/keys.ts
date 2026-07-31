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
  lists: (businessId: string) =>
    [...documentKeys.base, 'list', businessId] as const,
  list: (businessId: string, folderId: string) =>
    [...documentKeys.lists(businessId), folderId] as const,
  details: (businessId: string) =>
    [...documentKeys.base, 'detail', businessId] as const,
  detail: (businessId: string, documentId: string) =>
    [...documentKeys.details(businessId), documentId] as const,
};

export const folderKeys = {
  base: ['folders'] as const,
  list: (businessId: string) =>
    [...folderKeys.base, 'list', businessId] as const,
};

export const competitorKeys = {
  base: ['competitors'] as const,
  list: (businessId: string) =>
    [...competitorKeys.base, 'list', businessId] as const,
};

export const chatKeys = {
  base: ['chats'] as const,
  list: (businessId: string) => [...chatKeys.base, 'list', businessId] as const,
  detail: (businessId: string, chatId: string) =>
    [...chatKeys.base, 'detail', businessId, chatId] as const,
};
