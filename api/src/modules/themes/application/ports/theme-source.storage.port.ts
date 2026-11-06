import type { SourceFile } from "../../domain/source-manifest";

export interface UnpackedSourceFile extends SourceFile {
  content: Buffer | null;
}

export abstract class ThemeSourceStorage {
  abstract unpack(storageKey: string): Promise<UnpackedSourceFile[]>;
  abstract readBlob(
    marketplaceId: string,
    themeId: string,
    sha256: string,
  ): Promise<Buffer>;
  abstract hasPicture(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
  ): Promise<boolean>;
  abstract readPicture(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
  ): Promise<Buffer>;
  abstract writePicture(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
    image: Buffer,
  ): Promise<void>;
  abstract writeBlob(
    marketplaceId: string,
    themeId: string,
    sha256: string,
    content: Buffer,
  ): Promise<void>;
}
