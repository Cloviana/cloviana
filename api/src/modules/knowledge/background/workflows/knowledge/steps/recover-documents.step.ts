import { PrismaService } from "@/clients/prisma/prisma.service";
import { Logger } from "@nestjs/common";
import { DocumentStatus } from "@prisma/client";
import { KnowledgeEventsService } from "../knowledge.events";

const RECOVERY_INTERVAL_MS = 60_000;
const STALE_QUEUE_MS = 5 * 60_000;
const STALE_PROCESSING_MS = 20 * 60_000;
const RECOVERY_BATCH_SIZE = 50;
const logger = new Logger("RecoverKnowledgeDocumentsStep");

async function recoverInterruptedIngestions(
  prisma: PrismaService,
  nowMs: number,
): Promise<void> {
  const recoveryResult = await prisma.document.updateMany({
    where: {
      status: DocumentStatus.PROCESSING,
      deletedAt: null,
      ingestionStartedAt: {
        lt: new Date(nowMs - STALE_PROCESSING_MS),
      },
    },
    data: {
      status: DocumentStatus.PENDING,
      ingestionQueuedAt: null,
      ingestionStartedAt: null,
    },
  });

  if (recoveryResult.count > 0) {
    logger.warn(
      `Recovered ${recoveryResult.count} interrupted knowledge ingestion(s)`,
    );
  }
}

async function enqueuePendingIngestions(
  prisma: PrismaService,
  knowledgeEvents: KnowledgeEventsService,
  nowMs: number,
): Promise<void> {
  const pendingDocuments = await prisma.document.findMany({
    where: {
      status: DocumentStatus.PENDING,
      deletedAt: null,
      OR: [
        { ingestionQueuedAt: null },
        { ingestionQueuedAt: { lt: new Date(nowMs - STALE_QUEUE_MS) } },
      ],
    },
    select: { id: true, businessId: true },
    orderBy: { createdAt: "asc" },
    take: RECOVERY_BATCH_SIZE,
  });

  for (const document of pendingDocuments) {
    await knowledgeEvents.enqueueIngestion({
      documentId: document.id,
      businessId: document.businessId,
    });
    await prisma.document.updateMany({
      where: {
        id: document.id,
        status: DocumentStatus.PENDING,
        deletedAt: null,
      },
      data: { ingestionQueuedAt: new Date() },
    });
  }
}

async function enqueuePendingDeletions(
  prisma: PrismaService,
  knowledgeEvents: KnowledgeEventsService,
  nowMs: number,
): Promise<void> {
  const pendingDocuments = await prisma.document.findMany({
    where: {
      deletedAt: { lt: new Date(nowMs - RECOVERY_INTERVAL_MS) },
    },
    select: { id: true, businessId: true },
    orderBy: { deletedAt: "asc" },
    take: RECOVERY_BATCH_SIZE,
  });

  for (const document of pendingDocuments) {
    await knowledgeEvents.enqueueDeletion({
      documentId: document.id,
      businessId: document.businessId,
    });
  }
}

export async function recoverDocumentsStep(
  prisma: PrismaService,
  knowledgeEvents: KnowledgeEventsService,
): Promise<void> {
  try {
    const nowMs = Date.now();
    await recoverInterruptedIngestions(prisma, nowMs);
    await enqueuePendingIngestions(prisma, knowledgeEvents, nowMs);
    await enqueuePendingDeletions(prisma, knowledgeEvents, nowMs);
  } catch (error) {
    logger.error(
      `Knowledge recovery failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error.stack : undefined,
    );
    throw error;
  }
}
