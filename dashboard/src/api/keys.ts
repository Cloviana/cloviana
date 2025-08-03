export const blogsKeys = {
  base: ['blogs'] as const,
  list: () => [...blogsKeys.base, 'list'] as const,
  detail: (blogId: string) => [...blogsKeys.base, 'detail', blogId] as const,
};

export const topicSuggestionsKeys = {
  base: ['topicSuggestions'] as const,
  list: (storeId: string) =>
    [...topicSuggestionsKeys.base, 'list', storeId] as const,
};
