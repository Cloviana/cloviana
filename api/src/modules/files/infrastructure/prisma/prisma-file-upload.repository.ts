import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { FileUploadRepository } from "../../application/ports/file-upload.repository.port";
import type { FileAsset } from "../../domain/file";

const fields = {
  id: true,
  url: true,
  filename: true,
  type: true,
  mimeType: true,
  size: true,
  createdAt: true,
  storageKey: true,
} as const;

type RecordWithKey = FileAsset & { storageKey: string | null };

function toStoredUpload({ storageKey, ...asset }: RecordWithKey) {
  return { storageKey, asset };
}

@Injectable()
export class PrismaFileUploadRepository extends FileUploadRepository {
  constructor(private readonly db: PrismaService) {
    super();
  }

  async find(marketplaceId: string, stagingPath: string) {
    const record = await this.db.mediaAsset.findUnique({
      where: { marketplaceId_stagingPath: { marketplaceId, stagingPath } },
      select: fields,
    });
    return record ? toStoredUpload(record) : null;
  }

  async create(input: Parameters<FileUploadRepository["create"]>[0]) {
    const record = await this.db.mediaAsset.create({
      data: { ...input, sortName: input.filename.toLowerCase() },
      select: fields,
    });
    return toStoredUpload(record);
  }
}
