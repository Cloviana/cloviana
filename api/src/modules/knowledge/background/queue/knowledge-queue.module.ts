import { createRabbitMqClientProvider } from "@/infrastructure/rabbitmq/rabbitmq-client.provider";
import { Module } from "@nestjs/common";
import { KnowledgeProducer } from "./knowledge.producer";
import { KNOWLEDGE_QUEUE } from "./knowledge.queue";

const knowledgeRabbitMqClientProvider =
  createRabbitMqClientProvider(KNOWLEDGE_QUEUE);

@Module({
  providers: [knowledgeRabbitMqClientProvider, KnowledgeProducer],
  exports: [KnowledgeProducer],
})
export class KnowledgeQueueModule {}
