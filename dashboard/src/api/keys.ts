export const blogsKeys = {
  all: () => ['blogs'] as const,
  detail: (blogId: string) => [...blogsKeys.all(), 'detail', blogId] as const,
};
