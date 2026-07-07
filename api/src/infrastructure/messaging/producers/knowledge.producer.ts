import type { RunKnowledgeIngestionPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import {
  KNOWLEDGE_QUEUE,
  RUN_KNOWLEDGE_INGESTION_EVENT,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class KnowledgeProducer {
  constructor(
    @Inject(KNOWLEDGE_QUEUE.clientToken)
    private readonly client: ClientProxy,
  ) {}

  async runKnowledgeIngestion(
    payload: RunKnowledgeIngestionPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.client.emit(RUN_KNOWLEDGE_INGESTION_EVENT, payload),
    );
  }
}
