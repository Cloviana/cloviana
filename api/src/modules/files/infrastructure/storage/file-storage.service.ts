import { CloudflareR2Service } from "@/integrations/cloudflare-r2/cloudflare-r2.service";
import { DependencyUnavailableError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { fileTypeFromBuffer } from "file-type";
import { FileUploadStorage } from "../../application/ports/file-upload.port";

@Injectable()
export class FileStorageService extends FileUploadStorage {
  constructor(private readonly storage: CloudflareR2Service) {
    super();
  }

  async prepare(key: string, contentType: string) {
    try {
      const { url, contentType: uploadContentType } =
        await this.storage.prepareUpload(key, contentType);
      return { url, contentType: uploadContentType };
    } catch {
      throw new DependencyUnavailableError(
        "Could not prepare the media upload.",
      );
    }
  }

  async inspect(key: string) {
    try {
      const info = await this.storage.inspect(key);
      return {
        size: info.ContentLength,
        contentType: info.ContentType,
        version: info.ETag,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        typeof error.$metadata === "object" &&
        error.$metadata !== null &&
        "httpStatusCode" in error.$metadata &&
        error.$metadata.httpStatusCode === 404
      ) {
        return null;
      }
      throw new DependencyUnavailableError(
        "Could not inspect the media upload.",
      );
    }
  }

  async detectType(key: string, version: string) {
    const header = await this.storage.readHeader(key, version);
    const detected = header && (await fileTypeFromBuffer(header));
    return detected
      ? { mimeType: detected.mime, extension: detected.ext }
      : null;
  }

  promote(
    source: string,
    destination: string,
    version: string,
    contentType: string,
  ) {
    return this.storage.promote(source, destination, version, contentType);
  }

  remove(key: string) {
    return this.storage.remove(key);
  }
}
