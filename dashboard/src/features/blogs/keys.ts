import { storeKeys } from '@/api/keys';

export const getBlogsKey = (storeId: string) =>
  [...storeKeys.detail(storeId), 'blogs'] as const;

export const getBlogKey = (blogId: string) => ['blog', blogId] as const;

export const getSuggestedSourcesKey = (storeId: string, title: string) =>
  [...storeKeys.detail(storeId), 'suggested-sources', title] as const;

export const getBlogGenerationStatusKey = (blogId: string) =>
  ['blog', blogId, 'generationStatus'] as const;
