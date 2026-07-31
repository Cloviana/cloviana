import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DocumentStatus } from "@prisma/client";
import { KnowledgeProducer } from "./queue/knowledge.producer";

const RECOVERY_INTERVAL_MS = 60_000;
const STALE_QUEUE_MS = 5 * 60_000;
const STALE_PROCESSING_MS = 20 * 60_000;
const RECOVERY_BATCH_SIZE = 50;

@Injectable()
export class KnowledgeRecoveryService {
  private readonly logger = new Logger(KnowledgeRecoveryService.name);
  private isRecovering = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeProducer: KnowledgeProducer,
  ) {}

  @Interval(RECOVERY_INTERVAL_MS)
  async recoverStaleJobs(): Promise<void> {
    if (this.isRecovering) {
      return;
    }
    this.isRecovering = true;

    try {
      const nowMs = Date.now();
      await this.recoverInterruptedIngestions(nowMs);
      await this.enqueuePendingIngestions(nowMs);
      await this.enqueuePendingDeletions(nowMs);
    } catch (error) {
      this.logger.error(
        `Knowledge recovery failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isRecovering = false;
    }
  }

  private async recoverInterruptedIngestions(nowMs: number): Promise<void> {
    const recoveryResult = await this.prisma.document.updateMany({
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
      this.logger.warn(
        `Recovered ${recoveryResult.count} interrupted knowledge ingestion(s)`,
      );
    }
  }

  private async enqueuePendingIngestions(nowMs: number): Promise<void> {
    const pendingDocuments = await this.prisma.document.findMany({
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
      await this.knowledgeProducer.enqueueIngestion({
        documentId: document.id,
        businessId: document.businessId,
      });
      await this.prisma.document.updateMany({
        where: {
          id: document.id,
          status: DocumentStatus.PENDING,
          deletedAt: null,
        },
        data: { ingestionQueuedAt: new Date() },
      });
    }
  }

  private async enqueuePendingDeletions(nowMs: number): Promise<void> {
    const pendingDocuments = await this.prisma.document.findMany({
      where: {
        deletedAt: { lt: new Date(nowMs - RECOVERY_INTERVAL_MS) },
      },
      select: { id: true, businessId: true },
      orderBy: { deletedAt: "asc" },
      take: RECOVERY_BATCH_SIZE,
    });

    for (const document of pendingDocuments) {
      await this.knowledgeProducer.enqueueDeletion({
        documentId: document.id,
        businessId: document.businessId,
      });
    }
  }
}
