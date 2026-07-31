import { unlink } from "node:fs/promises";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { KnowledgeBaseClient } from "../knowledge-base.client";

@Injectable()
export class DocumentDeletionService {
  private readonly logger = new Logger(DocumentDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeBaseClient: KnowledgeBaseClient,
  ) {}

  async processDocumentDeletion(
    businessId: string,
    documentId: string,
  ): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, businessId, deletedAt: { not: null } },
      select: { filePath: true },
    });
    if (!document) {
      return;
    }

    try {
      await this.knowledgeBaseClient.deleteDocument(businessId, documentId);
      if (document.filePath) {
        await this.deleteSourceFile(document.filePath);
      }

      const deletionResult = await this.prisma.document.deleteMany({
        where: { id: documentId, businessId, deletedAt: { not: null } },
      });
      if (deletionResult.count > 0) {
        this.logger.log(
          `Deleted knowledge document businessId=${businessId} documentId=${documentId}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Knowledge deletion was interrupted and will recover automatically businessId=${businessId} documentId=${documentId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async deleteSourceFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Document deletion failed";
  }
}
