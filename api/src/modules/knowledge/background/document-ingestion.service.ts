import { readFile } from "node:fs/promises";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { DocumentStatus } from "@prisma/client";
import {
  KnowledgeBaseClient,
  KnowledgeBaseRequestError,
} from "../knowledge-base.client";
import type { DocumentIngestionResult } from "../knowledge.types";
import { KnowledgeProducer } from "./queue/knowledge.producer";

@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeBaseClient: KnowledgeBaseClient,
    private readonly knowledgeProducer: KnowledgeProducer,
  ) {}

  async processDocumentIngestion(
    businessId: string,
    documentId: string,
  ): Promise<DocumentIngestionResult> {
    const claimResult = await this.prisma.document.updateMany({
      where: {
        id: documentId,
        businessId,
        status: DocumentStatus.PENDING,
        deletedAt: null,
      },
      data: {
        status: DocumentStatus.PROCESSING,
        ingestionStartedAt: new Date(),
      },
    });

    if (claimResult.count === 0) {
      return "skipped";
    }

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, businessId, deletedAt: null },
      include: { folder: { select: { id: true, name: true } } },
    });
    if (!document) {
      return "skipped";
    }

    try {
      if (!document.filePath || !document.filename || !document.mimeType) {
        throw new KnowledgeBaseRequestError(
          "The stored source file is unavailable",
          false,
        );
      }

      const fileContent = await readFile(document.filePath);
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([Uint8Array.from(fileContent)], { type: document.mimeType }),
        document.filename,
      );
      formData.append("documentId", document.id);
      formData.append("businessId", document.businessId);
      formData.append("folderId", document.folder.id);
      formData.append("folderName", document.folder.name);

      const ingestionResult =
        await this.knowledgeBaseClient.ingestDocument(formData);
      const completionResult = await this.prisma.document.updateMany({
        where: {
          id: document.id,
          businessId: document.businessId,
          status: DocumentStatus.PROCESSING,
          deletedAt: null,
        },
        data: {
          status: DocumentStatus.READY,
          chunkCount: ingestionResult.chunksStored,
          ingestionQueuedAt: null,
          ingestionStartedAt: null,
          indexedAt: new Date(),
        },
      });

      return completionResult.count > 0 ? "indexed" : "skipped";
    } catch (error) {
      if (this.isRetryableError(error)) {
        await this.prisma.document.updateMany({
          where: {
            id: document.id,
            businessId: document.businessId,
            status: DocumentStatus.PROCESSING,
            deletedAt: null,
          },
          data: {
            status: DocumentStatus.PENDING,
            ingestionQueuedAt: new Date(),
            ingestionStartedAt: null,
          },
        });
        this.logger.warn(
          `Knowledge ingestion was interrupted and will recover automatically businessId=${businessId} documentId=${documentId}: ${this.getErrorMessage(error)}`,
        );
        return "deferred";
      }

      await this.scheduleDeletion(businessId, documentId);
      this.logger.warn(
        `Knowledge ingestion failed and document deletion was scheduled businessId=${businessId} documentId=${documentId}: ${this.getErrorMessage(error)}`,
      );
      return "failed";
    }
  }

  private async scheduleDeletion(
    businessId: string,
    documentId: string,
  ): Promise<void> {
    const deletionRequest = await this.prisma.document.updateMany({
      where: { id: documentId, businessId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (deletionRequest.count === 0) {
      return;
    }

    void this.knowledgeProducer
      .enqueueDeletion({ businessId, documentId })
      .catch((error) =>
        this.logger.error(
          `Failed to enqueue knowledge deletion businessId=${businessId} documentId=${documentId}; recovery will retry`,
          error instanceof Error ? error.stack : undefined,
        ),
      );
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof KnowledgeBaseRequestError) {
      return error.retryable;
    }
    return (error as NodeJS.ErrnoException)?.code !== "ENOENT";
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Document ingestion failed";
  }
}
