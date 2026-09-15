import { unlink } from "node:fs/promises";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Logger } from "@nestjs/common";
import { KnowledgeBaseClient } from "../../../../knowledge-base.client";
import type { KnowledgeDocumentEventData } from "../knowledge.events";

const logger = new Logger("DeleteKnowledgeDocumentStep");

async function deleteSourceFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteDocumentStep(
  prisma: PrismaService,
  knowledgeBaseClient: KnowledgeBaseClient,
  data: KnowledgeDocumentEventData,
): Promise<void> {
  const { businessId, documentId } = data;
  const document = await prisma.document.findFirst({
    where: { id: documentId, businessId, deletedAt: { not: null } },
    select: { filePath: true },
  });
  if (!document) {
    return;
  }

  try {
    await knowledgeBaseClient.deleteDocument(businessId, documentId);
    if (document.filePath) {
      await deleteSourceFile(document.filePath);
    }

    const deletionResult = await prisma.document.deleteMany({
      where: { id: documentId, businessId, deletedAt: { not: null } },
    });
    if (deletionResult.count > 0) {
      logger.log(
        `Deleted knowledge document businessId=${businessId} documentId=${documentId}`,
      );
    }
  } catch (error) {
    logger.warn(
      `Knowledge deletion was interrupted and will be retried businessId=${businessId} documentId=${documentId}: ${
        error instanceof Error ? error.message : "Document deletion failed"
      }`,
    );
    throw error;
  }
}
