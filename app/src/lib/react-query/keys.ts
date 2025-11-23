export const blogKeys = {
  all: ['blog'] as const,
  detail: (blogId: string) => [...blogKeys.all, blogId] as const,
};

export const suggestionsKeys = {
  all: ['suggestions'] as const,
  topics: (blogId: string) =>
    [...suggestionsKeys.all, 'topics', blogId] as const,
  primary: (blogId: string) =>
    [...suggestionsKeys.all, 'primary-keyword', blogId] as const,
  secondary: (blogId: string) =>
    [...suggestionsKeys.all, 'secondary-keywords', blogId] as const,
  product: (blogId: string) =>
    [...suggestionsKeys.all, 'product', blogId] as const,
};

export const storeKeys = {
  base: ['stores'] as const,
  list: () => [...storeKeys.base, 'list'] as const,
  detail: (storeId: string) => [...storeKeys.base, 'detail', storeId] as const,
  status: (storeId: string) => [...storeKeys.base, 'status', storeId] as const,
};
