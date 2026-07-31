export interface DocumentUpload {
  name: string;
  extension: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface KnowledgeSearchRequest {
  businessId: string;
  query: string;
  folderIds?: string[];
  limit?: number;
}

export interface KnowledgeSearchResult {
  text: string;
  score: number;
  documentId: string;
  businessId: string;
  folderId: string;
  folderName: string;
  filename: string;
  chunkIndex: number;
  title: string | null;
  section: string | null;
  chunkContext: string | null;
  okfType: string | null;
  resource: string | null;
}

export type DocumentIngestionResult =
  | "indexed"
  | "deferred"
  | "failed"
  | "skipped";
