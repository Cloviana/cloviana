import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { ConversationRepository } from "../../application/ports/conversation.repository.port";
import {
  CONTEXT_CHARACTER_LIMIT,
  CONTEXT_MESSAGE_LIMIT,
  CONVERSATION_PAGE_SIZE,
  MESSAGE_PAGE_SIZE,
} from "../../domain/agent.policy";
import type { Json } from "../../domain/agent.types";
import { conversationSelect } from "./agent.select";

@Injectable()
export class PrismaConversationRepository extends ConversationRepository {
  constructor(private readonly db: PrismaService) {
    super();
  }
  list(marketplaceId: string, themeId?: string) {
    return this.db.agentConversation.findMany({
      // A conversation belongs to a theme through its runs, so one with no run yet never matches.
      where: {
        marketplaceId,
        ...(themeId ? { agentRun_conversationId: { some: { themeId } } } : {}),
      },
      select: conversationSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: CONVERSATION_PAGE_SIZE,
    });
  }
  create(marketplaceId: string, ownerId: string, title?: string) {
    return this.db.agentConversation.create({
      data: { marketplaceId, createdBy: ownerId, title },
      select: conversationSelect,
    });
  }
  async conversation(marketplaceId: string, id: string) {
    const row = await this.db.agentConversation.findFirst({
      where: { id, marketplaceId },
      select: conversationSelect,
    });
    if (!row) {
      throw new ResourceNotFoundError("Conversation not found");
    }
    return row;
  }
  async messages(marketplaceId: string, conversationId: string, after = 0n) {
    await this.conversation(marketplaceId, conversationId);
    const rows = await this.db.agentMessage.findMany({
      where: { marketplaceId, conversationId, sequence: { gt: after } },
      orderBy: { sequence: "asc" },
      take: MESSAGE_PAGE_SIZE,
    });
    return rows.map(({ id, sequence, role, content, createdAt }) => ({
      id,
      sequence: sequence.toString(),
      role,
      content: content as Json,
      createdAt,
    }));
  }
  async contextMessages(marketplaceId: string, conversationId: string) {
    const rows = await this.db.agentMessage.findMany({
      where: {
        marketplaceId,
        conversationId,
        role: { in: ["USER", "ASSISTANT"] },
      },
      orderBy: { sequence: "desc" },
      take: CONTEXT_MESSAGE_LIMIT,
    });
    let size = 0;
    return rows
      .filter((row) => {
        size += JSON.stringify(row.content).length;
        return size <= CONTEXT_CHARACTER_LIMIT;
      })
      .reverse()
      .map(({ id, sequence, role, content, createdAt }) => ({
        id,
        sequence: sequence.toString(),
        role,
        content: content as Json,
        createdAt,
      }));
  }
}
