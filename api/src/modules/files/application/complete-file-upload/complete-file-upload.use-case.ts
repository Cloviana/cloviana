import { randomUUID } from "node:crypto";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { InvalidInputError } from "@/shared/errors/application-error";
import { Injectable, Logger } from "@nestjs/common";
import {
  MAX_FILE_UPLOAD_BYTES,
  isSupportedFileType,
} from "../../domain/file-upload.policy";
import {
  type CompleteFileUpload,
  FileUploadStorage,
} from "../ports/file-upload.port";
import { FileUploadRepository } from "../ports/file-upload.repository.port";

@Injectable()
export class CompleteFileUploadUseCase {
  private readonly logger = new Logger(CompleteFileUploadUseCase.name);

  constructor(
    private readonly marketplace: GetMarketplaceUseCase,
    private readonly storage: FileUploadStorage,
    private readonly uploads: FileUploadRepository,
  ) {}

  async execute(ownerId: string, slug: string, input: CompleteFileUpload) {
    const marketplace = await this.marketplace.execute({ ownerId, slug });
    const filename = input.filename.trim();
    if (!filename) {
      throw new InvalidInputError("Enter a filename.");
    }
    const stagingPath = `temporary/media-library/${marketplace.id}/${input.uploadId}`;
    const existing = await this.uploads.find(marketplace.id, stagingPath);
    if (existing) {
      return existing.asset;
    }
    const info = await this.storage.inspect(stagingPath);
    if (!info) {
      // A concurrent completion may have saved the asset and removed staging.
      const completed = await this.uploads.find(marketplace.id, stagingPath);
      if (completed) {
        return completed.asset;
      }
      throw new InvalidInputError("The upload is missing. Upload it again.");
    }
    if (
      !info.size ||
      info.size > MAX_FILE_UPLOAD_BYTES ||
      !info.contentType ||
      !info.version
    ) {
      throw new InvalidInputError("The upload is missing or invalid.");
    }
    const detected = await this.storage.detectType(stagingPath, info.version);
    if (
      !detected ||
      !isSupportedFileType(info.contentType, detected.mimeType)
    ) {
      throw new InvalidInputError(
        "Choose a supported file with a matching content type.",
      );
    }
    const storageKey = `media/${marketplace.id}/${randomUUID()}.${detected.extension}`;
    const url = await this.storage.promote(
      stagingPath,
      storageKey,
      info.version,
      detected.mimeType,
    );
    try {
      const saved = await this.uploads.create({
        marketplaceId: marketplace.id,
        stagingPath,
        storageKey,
        url,
        filename,
        type: detected.mimeType.startsWith("image/") ? "IMAGE" : "VIDEO",
        mimeType: detected.mimeType,
        size: info.size,
      });
      await this.discard(stagingPath);
      return saved.asset;
    } catch (error) {
      // A concurrent completion may have committed first. On an unknown commit
      // outcome retain our copy unless the saved record points elsewhere.
      const winner = await this.uploads
        .find(marketplace.id, stagingPath)
        .catch(() => null);
      if (winner) {
        if (winner.storageKey !== storageKey) {
          await this.discard(storageKey);
        }
        return winner.asset;
      }
      throw error;
    }
  }

  private async discard(key: string) {
    await this.storage
      .remove(key)
      .catch(() => this.logger.warn("Could not remove an unused media object"));
  }
}
