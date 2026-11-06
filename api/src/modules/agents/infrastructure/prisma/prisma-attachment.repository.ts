import { PrismaService } from "@/platform/database/prisma/prisma.service";
import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { AttachmentRepository } from "../../application/ports/attachment.repository.port";
import { ACTIVE_RUN_STATUSES } from "../../domain/agent.policy";
import { appendConversationMessage } from "./agent-message-log";

const attachmentSelect = {
  id: true,
  objectStorageKey: true,
  name: true,
  mimeType: true,
  sizeBytes: true,
  uploadStatus: true,
  expiresAt: true,
} as const;

@Injectable()
export class PrismaAttachmentRepository extends AttachmentRepository {
  constructor(private readonly db: PrismaService) {
    super();
  }

  get(marketplaceId: string, conversationId: string, id: string) {
    return this.db.agentAttachment.findFirst({
      where: { id, marketplaceId, message: { conversationId, marketplaceId } },
      select: attachmentSelect,
    });
  }

  async createPending(
    input: Parameters<AttachmentRepository["createPending"]>[0],
  ) {
    await this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM agent_conversations WHERE id=${input.conversationId}::uuid AND "marketplaceId"=${input.marketplaceId}::uuid AND status='ACTIVE' FOR UPDATE`;
      if (!rows.length) {
        throw new ResourceNotFoundError("Conversation not found");
      }
      if (
        await tx.agentRun.count({
          where: {
            marketplaceId: input.marketplaceId,
            conversationId: input.conversationId,
            status: { in: [...ACTIVE_RUN_STATUSES] },
          },
        })
      ) {
        throw new StateConflictError(
          "Wait for the active run before adding references",
        );
      }
      const message = await appendConversationMessage(tx, {
        marketplaceId: input.marketplaceId,
        conversationId: input.conversationId,
        role: "USER",
        createdBy: input.ownerId,
        content: {
          type: "attachment",
          attachmentId: input.id,
          name: input.name,
        },
      });
      await tx.agentAttachment.create({
        data: {
          id: input.id,
          marketplaceId: input.marketplaceId,
          messageId: message.id,
          objectStorageKey: input.storageKey,
          name: input.name,
          mimeType: input.mimeType,
          sizeBytes: BigInt(input.size),
          expiresAt: input.expiresAt,
        },
      });
    });
  }

  async markReady(marketplaceId: string, id: string, storageKey: string) {
    const result = await this.db.agentAttachment.updateMany({
      where: { id, marketplaceId, uploadStatus: "PENDING" },
      data: {
        uploadStatus: "READY",
        objectStorageKey: storageKey,
        expiresAt: null,
      },
    });
    return result.count > 0;
  }

  listReady(marketplaceId: string, conversationId: string, ids: string[]) {
    return this.db.agentAttachment.findMany({
      where: {
        id: { in: ids },
        marketplaceId,
        message: { conversationId, marketplaceId },
        uploadStatus: "READY",
      },
      select: attachmentSelect,
    });
  }
}
