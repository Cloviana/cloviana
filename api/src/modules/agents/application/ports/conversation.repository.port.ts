import type { Conversation, Message } from "../../domain/agent.types";

export abstract class ConversationRepository {
  abstract list(
    marketplaceId: string,
    themeId?: string,
  ): Promise<Conversation[]>;
  abstract create(
    marketplaceId: string,
    ownerId: string,
    title?: string,
  ): Promise<Conversation>;
  abstract conversation(
    marketplaceId: string,
    id: string,
  ): Promise<Conversation>;
  abstract messages(
    marketplaceId: string,
    conversationId: string,
    after?: bigint,
  ): Promise<Message[]>;
  abstract contextMessages(
    marketplaceId: string,
    conversationId: string,
  ): Promise<Message[]>;
}
