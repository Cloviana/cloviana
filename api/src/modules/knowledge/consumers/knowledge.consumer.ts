import type { RunKnowledgeIngestionPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import { RUN_KNOWLEDGE_INGESTION_EVENT } from "@/infrastructure/messaging/rabbitmq.contracts";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { KnowledgeService } from "../knowledge.service";

@Controller()
export class KnowledgeConsumer {
  private readonly logger = new Logger(KnowledgeConsumer.name);

  constructor(private readonly knowledge: KnowledgeService) {}

  @EventPattern(RUN_KNOWLEDGE_INGESTION_EVENT)
  async handleRunKnowledgeIngestion(
    @Payload() payload: RunKnowledgeIngestionPayload,
    @Ctx() context?: RmqContext,
  ) {
    const documentId = payload?.documentId?.trim();
    const businessId = payload?.businessId?.trim();

    if (!documentId || !businessId) {
      this.logger.error(
        `Received ${RUN_KNOWLEDGE_INGESTION_EVENT} with invalid documentId=${payload?.documentId} businessId=${payload?.businessId}`,
      );
      this.ack(context);
      return;
    }

    try {
      await this.knowledge.ingestQueuedDocument(businessId, documentId);
      this.logger.log(
        `Indexed knowledge document businessId=${businessId} documentId=${documentId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Knowledge ingestion failed businessId=${businessId} documentId=${documentId}: ${err.message}`,
        err.stack,
      );
    }

    this.ack(context);
  }

  private ack(context?: RmqContext) {
    if (!context) return;

    try {
      const channel = context.getChannelRef();
      const message = context.getMessage();
      channel.ack(message);
    } catch (err: any) {
      this.logger.warn(
        `Failed to ack message — channel already closed: ${err.message}`,
      );
    }
  }
}
