import { readFile } from "node:fs/promises";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Logger } from "@nestjs/common";
import { DocumentStatus } from "@prisma/client";
import {
  KnowledgeBaseClient,
  KnowledgeBaseRequestError,
} from "../../../../knowledge-base.client";
import type { DocumentIngestionResult } from "../../../../knowledge.types";
import {
  type KnowledgeDocumentEventData,
  KnowledgeEventsService,
} from "../knowledge.events";

const logger = new Logger("IngestKnowledgeDocumentStep");

function isRetryableError(error: unknown): boolean {
  if (error instanceof KnowledgeBaseRequestError) {
    return error.retryable;
  }
  return (error as NodeJS.ErrnoException)?.code !== "ENOENT";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Document ingestion failed";
}

async function scheduleDeletion(
  prisma: PrismaService,
  knowledgeEvents: KnowledgeEventsService,
  businessId: string,
  documentId: string,
): Promise<void> {
  const deletionRequest = await prisma.document.updateMany({
    where: { id: documentId, businessId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (deletionRequest.count === 0) {
    return;
  }

  void knowledgeEvents
    .enqueueDeletion({ businessId, documentId })
    .catch((error) =>
      logger.error(
        `Failed to enqueue knowledge deletion businessId=${businessId} documentId=${documentId}; recovery will retry`,
        error instanceof Error ? error.stack : undefined,
      ),
    );
}

export async function ingestDocumentStep(
  prisma: PrismaService,
  knowledgeBaseClient: KnowledgeBaseClient,
  knowledgeEvents: KnowledgeEventsService,
  data: KnowledgeDocumentEventData,
): Promise<DocumentIngestionResult> {
  const { businessId, documentId } = data;
  const claimResult = await prisma.document.updateMany({
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

  const document = await prisma.document.findFirst({
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

    const ingestionResult = await knowledgeBaseClient.ingestDocument(formData);
    const completionResult = await prisma.document.updateMany({
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
    if (isRetryableError(error)) {
      await prisma.document.updateMany({
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
      logger.warn(
        `Knowledge ingestion was interrupted and will be retried businessId=${businessId} documentId=${documentId}: ${getErrorMessage(error)}`,
      );
      throw error;
    }

    await scheduleDeletion(prisma, knowledgeEvents, businessId, documentId);
    logger.warn(
      `Knowledge ingestion failed and document deletion was scheduled businessId=${businessId} documentId=${documentId}: ${getErrorMessage(error)}`,
    );
    return "failed";
  }
}
