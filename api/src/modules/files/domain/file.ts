export const FILE_SORTS = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "size_asc",
  "size_desc",
] as const;
export type FileSort = (typeof FILE_SORTS)[number];
export type FileType = "IMAGE" | "VIDEO";
export interface ListFilesInput {
  marketplaceId: string;
  query?: string;
  type?: FileType;
  minSize?: number;
  maxSize?: number;
  productId?: string;
  sort: FileSort;
  limit: number;
  cursor?: string;
}
export interface FileAsset {
  id: string;
  url: string;
  filename: string | null;
  type: FileType;
  mimeType: string | null;
  size: number | null;
  createdAt: Date;
}
export interface FilePage {
  items: FileAsset[];
  nextCursor: string | null;
}
