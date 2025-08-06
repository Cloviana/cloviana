export const blogsKeys = {
  base: ['blogs'] as const,
  list: () => [...blogsKeys.base, 'list'] as const,
  detail: (blogId: string) => [...blogsKeys.base, 'detail', blogId] as const,
};

export const keywordsKeys = {
  base: ['keywords'] as const,
  list: (type: string) => [...blogsKeys.base, 'list', type] as const,
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
