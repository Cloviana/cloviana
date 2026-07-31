import type { RabbitMqQueueDefinition } from "@/infrastructure/rabbitmq/rabbitmq.options";

export interface KnowledgeIngestionPayload {
  documentId: string;
  businessId: string;
}

export interface KnowledgeDeletionPayload {
  documentId: string;
  businessId: string;
}

export const KNOWLEDGE_INGESTION_EVENT = "knowledge.ingestion.run";
export const KNOWLEDGE_DELETION_EVENT = "knowledge.deletion.run";

export const KNOWLEDGE_QUEUE: RabbitMqQueueDefinition = {
  clientToken: "KNOWLEDGE_CLIENT",
  queue: "knowledge_queue",
  prefetchCount: 2,
  noAck: false,
  queueOptions: {
    durable: true,
    autoDelete: false,
  },
};
