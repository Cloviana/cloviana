export interface PrepareFileUpload {
  filename: string;
  contentType: string;
  size: number;
}

export interface CompleteFileUpload {
  uploadId: string;
  filename: string;
}

export interface StagedFile {
  size: number | undefined;
  contentType: string | undefined;
  version: string | undefined;
}

export abstract class FileUploadStorage {
  abstract prepare(
    key: string,
    contentType: string,
  ): Promise<{ url: string; contentType: string }>;
  abstract inspect(key: string): Promise<StagedFile | null>;
  abstract detectType(
    key: string,
    version: string,
  ): Promise<{ mimeType: string; extension: string } | null>;
  abstract promote(
    source: string,
    destination: string,
    version: string,
    contentType: string,
  ): Promise<string>;
  abstract remove(key: string): Promise<void>;
}
