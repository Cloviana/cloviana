import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { InvalidInputError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { isValidFileUpload } from "../../domain/file-upload.policy";
import {
  FileUploadStorage,
  type PrepareFileUpload,
} from "../ports/file-upload.port";
@Injectable()
export class PrepareFileUploadUseCase {
  constructor(
    private readonly marketplace: GetMarketplaceUseCase,
    private readonly storage: FileUploadStorage,
  ) {}
  async execute(ownerId: string, slug: string, input: PrepareFileUpload) {
    if (!isValidFileUpload(input)) {
      throw new InvalidInputError("Invalid file upload request.");
    }
    const marketplace = await this.marketplace.execute({ ownerId, slug });
    const uploadId = randomUUID();
    const upload = await this.storage.prepare(
      `temporary/media-library/${marketplace.id}/${uploadId}`,
      input.contentType,
    );
    return { uploadId, ...upload };
  }
}
import { randomUUID } from "node:crypto";
