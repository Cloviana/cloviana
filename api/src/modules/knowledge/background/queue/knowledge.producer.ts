import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type {
  KnowledgeDeletionPayload,
  KnowledgeIngestionPayload,
} from "./knowledge.queue";
import {
  KNOWLEDGE_DELETION_EVENT,
  KNOWLEDGE_INGESTION_EVENT,
  KNOWLEDGE_QUEUE,
} from "./knowledge.queue";

@Injectable()
export class KnowledgeProducer {
  constructor(
    @Inject(KNOWLEDGE_QUEUE.clientToken)
    private readonly rabbitMqClient: ClientProxy,
  ) {}

  async enqueueIngestion(payload: KnowledgeIngestionPayload): Promise<void> {
    await firstValueFrom(
      this.rabbitMqClient.emit(KNOWLEDGE_INGESTION_EVENT, payload),
    );
  }

  async enqueueDeletion(payload: KnowledgeDeletionPayload): Promise<void> {
    await firstValueFrom(
      this.rabbitMqClient.emit(KNOWLEDGE_DELETION_EVENT, payload),
    );
  }
}
