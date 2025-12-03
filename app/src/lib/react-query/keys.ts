export const blogKeys = {
  all: ['blog'] as const,
  list: (storeId: string, params?: Record<string, unknown>) =>
    [...blogKeys.all, 'list', storeId, params ?? {}] as const,
  detail: (blogId: string) => [...blogKeys.all, blogId] as const,
};

export const catalogKeys = {
  all: ['catalog'] as const,
  products: (storeId: string, params?: { page?: number; limit?: number }) =>
    [
      ...catalogKeys.all,
      'products',
      storeId,
      ...(params ? [params] : []),
    ] as const,
  collections: (storeId: string, params?: { page?: number; limit?: number }) =>
    [
      ...catalogKeys.all,
      'collections',
      storeId,
      ...(params ? [params] : []),
    ] as const,
  search: (storeId: string, params?: { q?: string; limit?: number }) =>
    [
      ...catalogKeys.all,
      'search',
      storeId,
      ...(params ? [params] : []),
    ] as const,
};

export const suggestionKeys = {
  topic: (storeId: string, blogId: string) =>
    ['stores', storeId, 'blogs', blogId, 'suggestions', 'topic'] as const,
  primaryKeyword: (storeId: string, blogId: string) =>
    [
      'stores',
      storeId,
      'blogs',
      blogId,
      'suggestions',
      'primary-keyword',
    ] as const,
  secondaryKeywords: (storeId: string, blogId: string) =>
    [
      'stores',
      storeId,
      'blogs',
      blogId,
      'suggestions',
      'secondary-keywords',
    ] as const,
};

export const storeKeys = {
  base: ['stores'] as const,
  list: () => [...storeKeys.base, 'list'] as const,
  detail: (storeId: string) => [...storeKeys.base, 'detail', storeId] as const,
  status: (storeId: string) => [...storeKeys.base, 'status', storeId] as const,
};
