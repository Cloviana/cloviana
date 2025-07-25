import { getStoreKey } from '../stores/keys';

export const getBlogsKey = (storeId: string) =>
  [...getStoreKey(storeId), 'blogs'] as const;

export const getBlogKey = (blogId: string) => ['blog', blogId] as const;

export const getSuggestedSourcesKey = (storeId: string, title: string) =>
  [...getStoreKey(storeId), 'suggested-sources', title] as const;

export const getBlogGenerationStatusKey = (blogId: string) =>
  ['blog', blogId, 'generationStatus'] as const;
