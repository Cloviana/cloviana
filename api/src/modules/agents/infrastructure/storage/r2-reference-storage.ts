import { CloudflareR2Service } from "@/integrations/cloudflare-r2/cloudflare-r2.service";
import { Injectable } from "@nestjs/common";
import { fileTypeFromBuffer } from "file-type";
import { ReferenceStorage } from "../../application/ports/reference-storage.port";

@Injectable()
export class R2ReferenceStorage extends ReferenceStorage {
  constructor(private readonly r2: CloudflareR2Service) {
    super();
  }

  prepareUpload(
    key: string,
    mimeType: string,
    size: number,
    expiresIn: number,
  ) {
    return this.r2.preparePrivateUpload(key, mimeType, size, expiresIn);
  }
  downloadUrl(key: string) {
    return this.r2.privateDownloadUrl(key);
  }
  read(key: string, maxBytes: number) {
    return this.r2.readPrivate(key, maxBytes);
  }
  write(key: string, data: Buffer, mimeType: string) {
    return this.r2.writePrivate(key, data, mimeType);
  }
  remove(key: string) {
    return this.r2.removePrivate(key);
  }
  async detectImageMime(data: Buffer) {
    return (await fileTypeFromBuffer(data))?.mime ?? null;
  }
}
