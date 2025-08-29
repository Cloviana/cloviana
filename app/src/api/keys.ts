export const blogsKeys = {
  base: ['blogs'] as const,
  list: () => [...blogsKeys.base, 'list'] as const,
  detail: (blogId: string) => [...blogsKeys.base, 'detail', blogId] as const,
};

export const storeKeys = {
  base: ['stores'] as const,
  list: () => [...storeKeys.base, 'list'] as const,
  detail: (storeId: string) => [...storeKeys.base, 'detail', storeId] as const,
  status: (storeId: string) => [...storeKeys.base, 'status', storeId] as const,
};

export const keywordsKeys = {
  base: ['keywords'] as const,
  list: (storeId: string) => [...keywordsKeys.base, 'list', storeId] as const,
};

export const topicSuggestionsKeys = {
  base: ['topic-suggestions'] as const,
  list: (storeId: string) =>
    [...topicSuggestionsKeys.base, 'list', storeId] as const,
};

export const keywordSuggestionsKeys = {
  base: ['keywords-suggestions'] as const,
  list: (storeId: string, blogId: string) =>
    [...keywordSuggestionsKeys.base, 'list', storeId, blogId] as const,
};

export const titleSuggestionsKeys = {
  base: ['titles-suggestions'] as const,
  list: (storeId: string, blogId: string) =>
    [...titleSuggestionsKeys.base, 'list', storeId, blogId] as const,
};

export const productKeys = {
  base: ['products'] as const,
  list: (storeId: string) => [...productKeys.base, 'list', storeId] as const,
};

export const jobsKeys = {
  base: ['jobs'] as const,
  list: (storeId: string) => [...jobsKeys.base, 'list', storeId] as const,
  detail: (storeId: string, jobId: string) =>
    [...jobsKeys.base, 'detail', storeId, jobId] as const,
  latest: (storeId: string, type: string) =>
    [...jobsKeys.base, 'latest', storeId, type] as const,
  latestStatus: (storeId: string, type: string) =>
    [...jobsKeys.base, 'latestStatus', storeId, type] as const,
};
