import { CloudflareR2Service } from "@/integrations/cloudflare-r2/cloudflare-r2.service";
import { Injectable } from "@nestjs/common";
import { ThemeSourceStorage } from "../../application/ports/theme-source.storage.port";
import {
  MAX_PICTURE_BYTES,
  MAX_SNAPSHOT_BYTES,
  MAX_SOURCE_FILE_BYTES,
} from "../../domain/workspace.policy";
import { unpackSnapshot } from "./unpack-snapshot";

const blobKey = (marketplaceId: string, themeId: string, sha256: string) =>
  `themes/${marketplaceId}/${themeId}/blobs/${sha256}`;

const pictureKey = (
  marketplaceId: string,
  themeId: string,
  revisionId: string,
) => `themes/${marketplaceId}/${themeId}/pictures/${revisionId}.png`;

@Injectable()
export class R2ThemeSourceStorage extends ThemeSourceStorage {
  constructor(private readonly r2: CloudflareR2Service) {
    super();
  }
  async unpack(storageKey: string) {
    return unpackSnapshot(
      await this.r2.readPrivate(storageKey, MAX_SNAPSHOT_BYTES),
    );
  }
  hasPicture(marketplaceId: string, themeId: string, revisionId: string) {
    return this.readPicture(marketplaceId, themeId, revisionId).then(
      () => true,
      () => false,
    );
  }
  readPicture(marketplaceId: string, themeId: string, revisionId: string) {
    return this.r2.readPrivate(
      pictureKey(marketplaceId, themeId, revisionId),
      MAX_PICTURE_BYTES,
    );
  }
  writePicture(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
    image: Buffer,
  ) {
    return this.r2.writePrivate(
      pictureKey(marketplaceId, themeId, revisionId),
      image,
      "image/png",
    );
  }
  readBlob(marketplaceId: string, themeId: string, sha256: string) {
    return this.r2.readPrivate(
      blobKey(marketplaceId, themeId, sha256),
      MAX_SOURCE_FILE_BYTES,
    );
  }
  writeBlob(
    marketplaceId: string,
    themeId: string,
    sha256: string,
    content: Buffer,
  ) {
    return this.r2.writePrivate(
      blobKey(marketplaceId, themeId, sha256),
      content,
      "text/plain; charset=utf-8",
    );
  }
}
