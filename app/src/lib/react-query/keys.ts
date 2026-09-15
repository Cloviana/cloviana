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

export const topicKeys = {
  base: ['topics'] as const,
  list: (businessId: string) =>
    [...topicKeys.base, 'list', businessId] as const,
};

export const tagKeys = {
  base: ['tags'] as const,
  list: (businessId: string) => [...tagKeys.base, 'list', businessId] as const,
};

export const promptKeys = {
  base: ['prompts'] as const,
  lists: (businessId: string) =>
    [...promptKeys.base, 'list', businessId] as const,
  list: (businessId: string, query: object) =>
    [...promptKeys.lists(businessId), query] as const,
  detail: (businessId: string, promptId: string) =>
    [...promptKeys.base, 'detail', businessId, promptId] as const,
  mentionRate: (businessId: string, promptId: string, query: object) =>
    [
      ...promptKeys.detail(businessId, promptId),
      'mention-rate',
      query,
    ] as const,
  ranking: (businessId: string, promptId: string, query: object) =>
    [...promptKeys.detail(businessId, promptId), 'ranking', query] as const,
  sourceDomains: (businessId: string, promptId: string, query: object) =>
    [
      ...promptKeys.detail(businessId, promptId),
      'source-domains',
      query,
    ] as const,
  domainTypes: (businessId: string, promptId: string, query: object) =>
    [
      ...promptKeys.detail(businessId, promptId),
      'domain-types',
      query,
    ] as const,
  sourceUrls: (businessId: string, promptId: string, query: object) =>
    [...promptKeys.detail(businessId, promptId), 'source-urls', query] as const,
  urlTypes: (businessId: string, promptId: string, query: object) =>
    [...promptKeys.detail(businessId, promptId), 'url-types', query] as const,
  fanOutQueries: (businessId: string, promptId: string, query: object) =>
    [
      ...promptKeys.detail(businessId, promptId),
      'fan-out-queries',
      query,
    ] as const,
  brandPerception: (businessId: string, promptId: string, query: object) =>
    [
      ...promptKeys.detail(businessId, promptId),
      'brand-perception',
      query,
    ] as const,
  options: (businessId: string) =>
    [...promptKeys.lists(businessId), 'options'] as const,
  responseLists: (businessId: string) =>
    [...promptKeys.base, 'responses', businessId] as const,
  responseList: (businessId: string, query: object) =>
    [...promptKeys.responseLists(businessId), query] as const,
  responseDetail: (businessId: string, responseId: string) =>
    [...promptKeys.responseLists(businessId), 'detail', responseId] as const,
};

export const brandKitKeys = {
  base: ['brand-kit'] as const,
  draftMutations: () => [...brandKitKeys.base, 'draft-mutation'] as const,
  detail: (businessId: string) =>
    [...brandKitKeys.base, 'detail', businessId] as const,
  versions: (businessId: string) =>
    [...brandKitKeys.base, 'versions', businessId] as const,
  version: (businessId: string, versionId: string) =>
    [...brandKitKeys.versions(businessId), versionId] as const,
  productResearch: (businessId: string, workflowRunId: string) =>
    [
      ...brandKitKeys.base,
      'product-research',
      businessId,
      workflowRunId,
    ] as const,
  contentTypeResearch: (businessId: string, workflowRunId: string) =>
    [
      ...brandKitKeys.base,
      'content-type-research',
      businessId,
      workflowRunId,
    ] as const,
};

export const chatKeys = {
  base: ['chats'] as const,
  list: (businessId: string) => [...chatKeys.base, 'list', businessId] as const,
  detail: (businessId: string, chatId: string) =>
    [...chatKeys.base, 'detail', businessId, chatId] as const,
};
