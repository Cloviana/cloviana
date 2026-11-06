export interface ReferenceFile {
  name: string;
  mimeType: string;
  data: Buffer;
}

export abstract class ReferenceStorage {
  abstract prepareUpload(
    key: string,
    mimeType: string,
    size: number,
    expiresIn: number,
  ): Promise<string>;
  abstract downloadUrl(key: string): Promise<string>;
  abstract read(key: string, maxBytes: number): Promise<Buffer>;
  abstract write(key: string, data: Buffer, mimeType: string): Promise<void>;
  abstract remove(key: string): Promise<void>;
  abstract detectImageMime(data: Buffer): Promise<string | null>;
}
