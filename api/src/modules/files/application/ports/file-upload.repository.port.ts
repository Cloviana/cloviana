import type { FileAsset, FileType } from "../../domain/file";

export interface StoredFileUpload {
  asset: FileAsset;
  storageKey: string | null;
}

export abstract class FileUploadRepository {
  abstract find(
    marketplaceId: string,
    stagingPath: string,
  ): Promise<StoredFileUpload | null>;
  abstract create(input: {
    marketplaceId: string;
    stagingPath: string;
    storageKey: string;
    url: string;
    filename: string;
    type: FileType;
    mimeType: string;
    size: number;
  }): Promise<StoredFileUpload>;
}
