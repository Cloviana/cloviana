import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/common/config/app.configuration";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DocumentStatus, Prisma } from "@prisma/client";
import { KnowledgeEventsService } from "../background/workflows/knowledge/knowledge.events";
import { FoldersService } from "../folders/folders.service";
import { KnowledgeBaseClient } from "../knowledge-base.client";
import type { DocumentUpload } from "../knowledge.types";

const DOCUMENT_RESPONSE_SELECT = {
  id: true,
  businessId: true,
  folderId: true,
  name: true,
  extension: true,
  filename: true,
  mimeType: true,
  sizeBytes: true,
  position: true,
  status: true,
  chunkCount: true,
  indexedAt: true,
  createdAt: true,
  updatedAt: true,
  folder: { select: { id: true, name: true, parentId: true } },
} as const;

const MAX_DOCUMENT_NAME_LENGTH = 255;

interface UpdateDocumentInput {
  name?: string;
  folderId?: string;
  position?: number;
}

interface ReorderDocumentInput {
  businessId: string;
  documentId: string;
  sourceFolderId: string;
  targetFolderId: string;
  targetPosition?: number;
  currentStatus: DocumentStatus;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly foldersService: FoldersService,
    private readonly knowledgeBaseClient: KnowledgeBaseClient,
    private readonly knowledgeEvents: KnowledgeEventsService,
    config: AppConfiguration,
  ) {
    this.uploadsDir = config.knowledgeUploadsDir;
  }

  listDocuments(businessId: string, folderId?: string) {
    return this.prisma.document.findMany({
      where: {
        businessId,
        deletedAt: null,
        ...(folderId ? { folderId } : {}),
      },
      select: DOCUMENT_RESPONSE_SELECT,
      orderBy: [
        { folderId: "asc" },
        { position: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
  }

  async uploadDocuments(
    businessId: string,
    folderId: string | undefined,
    uploads: DocumentUpload[],
  ) {
    const folder = folderId
      ? await this.foldersService.findFolderOrThrow(businessId, folderId)
      : await this.foldersService.getOrCreateDefaultFolder(businessId);
    const businessDirectory = join(this.uploadsDir, businessId);
    await mkdir(businessDirectory, { recursive: true });
    const lastDocument = await this.prisma.document.findFirst({
      where: { businessId, folderId: folder.id, deletedAt: null },
      select: { position: true },
      orderBy: { position: "desc" },
    });
    const nextPosition = (lastDocument?.position ?? -1) + 1;

    const documentsToCreate = uploads.map((upload, index) => {
      const id = randomUUID();
      return {
        ...upload,
        id,
        position: nextPosition + index,
        filePath: join(businessDirectory, `${id}.${upload.extension}`),
      };
    });

    try {
      await Promise.all(
        documentsToCreate.map((document) =>
          writeFile(document.filePath, document.buffer),
        ),
      );
      await this.prisma.$transaction(
        documentsToCreate.map((document) =>
          this.prisma.document.create({
            data: {
              id: document.id,
              businessId,
              folderId: folder.id,
              name: document.name,
              extension: document.extension,
              filename: document.filename,
              mimeType: document.mimeType,
              sizeBytes: document.buffer.byteLength,
              position: document.position,
              filePath: document.filePath,
              status: DocumentStatus.PENDING,
            },
          }),
        ),
      );
    } catch (error) {
      await Promise.allSettled(
        documentsToCreate.map((document) => unlink(document.filePath)),
      );
      throw error;
    }

    await Promise.all(
      documentsToCreate.map((document) =>
        this.enqueueIngestion(businessId, document.id),
      ),
    );
    return this.prisma.document.findMany({
      where: {
        id: { in: documentsToCreate.map((document) => document.id) },
        businessId,
        deletedAt: null,
      },
      select: DOCUMENT_RESPONSE_SELECT,
      orderBy: { createdAt: "asc" },
    });
  }

  async updateDocument(
    businessId: string,
    documentId: string,
    update: UpdateDocumentInput,
  ) {
    const document = await this.findDocumentOrThrow(businessId, documentId);
    const targetFolderId = update.folderId ?? document.folderId;
    const folderChanged = targetFolderId !== document.folderId;
    const targetFolder = folderChanged
      ? await this.foldersService.findFolderOrThrow(businessId, targetFolderId)
      : document.folder;

    // Renaming only touches Postgres: Qdrant stores the uploaded filename, not
    // this display name, so there is nothing to sync to the knowledge base.
    if (update.name !== undefined) {
      const normalizedName = this.normalizeDocumentName(update.name);
      if (normalizedName !== document.name) {
        await this.prisma.document.updateMany({
          where: { id: documentId, businessId, deletedAt: null },
          data: { name: normalizedName },
        });
      }
    }

    if (!folderChanged && update.position === undefined) {
      return this.getDocumentOrThrow(businessId, documentId);
    }
    if (folderChanged && document.status === DocumentStatus.PROCESSING) {
      throw new ConflictException(
        "Wait for document ingestion to finish before moving it",
      );
    }

    if (folderChanged && document.status === DocumentStatus.READY) {
      await this.knowledgeBaseClient.moveDocument(
        businessId,
        documentId,
        targetFolder.id,
        targetFolder.name,
      );
    }

    try {
      await this.reorderDocument({
        businessId,
        documentId,
        sourceFolderId: document.folderId,
        targetFolderId,
        targetPosition: update.position,
        currentStatus: document.status,
      });
    } catch (error) {
      if (folderChanged && document.status === DocumentStatus.READY) {
        await this.knowledgeBaseClient
          .moveDocument(
            businessId,
            documentId,
            document.folder.id,
            document.folder.name,
          )
          .catch(() => undefined);
      }
      throw error;
    }

    return this.getDocumentOrThrow(businessId, documentId);
  }

  async deleteDocument(businessId: string, documentId: string): Promise<void> {
    const deletionRequest = await this.prisma.document.updateMany({
      where: { id: documentId, businessId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (deletionRequest.count === 0) {
      return;
    }

    void this.knowledgeEvents
      .enqueueDeletion({ businessId, documentId })
      .catch((error) =>
        this.logger.error(
          `Failed to enqueue knowledge deletion businessId=${businessId} documentId=${documentId}; recovery will retry`,
          error instanceof Error ? error.stack : undefined,
        ),
      );
  }

  private async enqueueIngestion(
    businessId: string,
    documentId: string,
  ): Promise<void> {
    try {
      await this.knowledgeEvents.enqueueIngestion({
        businessId,
        documentId,
      });
      await this.prisma.document.updateMany({
        where: {
          id: documentId,
          businessId,
          status: DocumentStatus.PENDING,
          deletedAt: null,
        },
        data: { ingestionQueuedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue knowledge ingestion businessId=${businessId} documentId=${documentId}; recovery will retry`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private normalizeDocumentName(name: string): string {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      throw new BadRequestException("Document name is required");
    }
    if (normalizedName.length > MAX_DOCUMENT_NAME_LENGTH) {
      throw new BadRequestException(
        `Document name cannot be longer than ${MAX_DOCUMENT_NAME_LENGTH} characters`,
      );
    }
    return normalizedName;
  }

  private async reorderDocument(input: ReorderDocumentInput): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const folderChanged = input.sourceFolderId !== input.targetFolderId;
      const targetDocuments = await this.findOrderedDocuments(
        transaction,
        input.businessId,
        input.targetFolderId,
        input.documentId,
      );
      const targetPosition = Math.min(
        input.targetPosition ?? targetDocuments.length,
        targetDocuments.length,
      );
      targetDocuments.splice(targetPosition, 0, { id: input.documentId });

      if (folderChanged) {
        const sourceDocuments = await this.findOrderedDocuments(
          transaction,
          input.businessId,
          input.sourceFolderId,
          input.documentId,
        );
        await Promise.all(
          sourceDocuments.map((document, position) =>
            transaction.document.update({
              where: { id: document.id },
              data: { position },
            }),
          ),
        );
      }

      const updateResult = await transaction.document.updateMany({
        where: {
          id: input.documentId,
          businessId: input.businessId,
          deletedAt: null,
          ...(folderChanged ? { status: input.currentStatus } : {}),
        },
        data: {
          folderId: input.targetFolderId,
          position: targetPosition,
        },
      });
      if (updateResult.count === 0) {
        throw new ConflictException(
          "Document status changed while it was being moved; try again",
        );
      }

      await Promise.all(
        targetDocuments.flatMap((document, position) =>
          document.id === input.documentId
            ? []
            : [
                transaction.document.update({
                  where: { id: document.id },
                  data: { position },
                }),
              ],
        ),
      );
    });
  }

  private findOrderedDocuments(
    transaction: Prisma.TransactionClient,
    businessId: string,
    folderId: string,
    excludedDocumentId: string,
  ) {
    return transaction.document.findMany({
      where: {
        businessId,
        folderId,
        id: { not: excludedDocumentId },
        deletedAt: null,
      },
      select: { id: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    });
  }

  private getDocumentOrThrow(businessId: string, documentId: string) {
    return this.prisma.document.findFirstOrThrow({
      where: { id: documentId, businessId, deletedAt: null },
      select: DOCUMENT_RESPONSE_SELECT,
    });
  }

  private async findDocumentOrThrow(businessId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, businessId, deletedAt: null },
      include: { folder: { select: { id: true, name: true } } },
    });
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    return document;
  }
}
