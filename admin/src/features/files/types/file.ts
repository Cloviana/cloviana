export const FILE_SORTS = [
  'newest',
  'oldest',
  'name_asc',
  'name_desc',
  'size_asc',
  'size_desc',
] as const;
export type FileSort = (typeof FILE_SORTS)[number];
export type FileType = 'IMAGE' | 'VIDEO';
export type FileAsset = {
  id: string;
  url: string;
  filename: string | null;
  type: FileType;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
};
export type FileListParams = {
  query?: string;
  type?: FileType;
  minSize?: number;
  maxSize?: number;
  productId?: string;
  sort?: FileSort;
  limit?: number;
  cursor?: string;
};
export type FilePage = { items: FileAsset[]; nextCursor: string | null };
export type PrepareFileUpload = {
  filename: string;
  contentType: string;
  size: number;
};
export type PreparedFileUpload = {
  uploadId: string;
  url: string;
  contentType: string;
};
export type CompleteFileUpload = { uploadId: string; filename: string };
