import {
  acknowledgeRabbitMqMessage,
  requeueRabbitMqMessage,
} from "@/infrastructure/rabbitmq/rabbitmq-settlement";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { DocumentDeletionService } from "../document-deletion.service";
import { DocumentIngestionService } from "../document-ingestion.service";
import type {
  KnowledgeDeletionPayload,
  KnowledgeIngestionPayload,
} from "./knowledge.queue";
import {
  KNOWLEDGE_DELETION_EVENT,
  KNOWLEDGE_INGESTION_EVENT,
} from "./knowledge.queue";

function getErrorDetails(error: unknown): {
  message: string;
  stack?: string;
} {
  return error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error) };
}

@Controller()
export class KnowledgeConsumer {
  private readonly logger = new Logger(KnowledgeConsumer.name);

  constructor(
    private readonly documentIngestion: DocumentIngestionService,
    private readonly documentDeletion: DocumentDeletionService,
  ) {}

  @EventPattern(KNOWLEDGE_INGESTION_EVENT)
  async handleIngestion(
    @Payload() payload: KnowledgeIngestionPayload,
    @Ctx() context?: RmqContext,
  ): Promise<void> {
    const documentId = payload?.documentId?.trim();
    const businessId = payload?.businessId?.trim();

    if (!documentId || !businessId) {
      this.logger.error(
        `Received ${KNOWLEDGE_INGESTION_EVENT} with an invalid payload`,
      );
      acknowledgeRabbitMqMessage(context, this.logger);
      return;
    }

    try {
      const ingestionResult =
        await this.documentIngestion.processDocumentIngestion(
          businessId,
          documentId,
        );
      if (ingestionResult === "indexed") {
        this.logger.log(
          `Indexed knowledge document businessId=${businessId} documentId=${documentId}`,
        );
      }
      acknowledgeRabbitMqMessage(context, this.logger);
    } catch (error) {
      const details = getErrorDetails(error);
      this.logger.error(
        `Knowledge ingestion consumer failed businessId=${businessId} documentId=${documentId}: ${details.message}`,
        details.stack,
      );
      requeueRabbitMqMessage(context, this.logger);
    }
  }

  @EventPattern(KNOWLEDGE_DELETION_EVENT)
  async handleDeletion(
    @Payload() payload: KnowledgeDeletionPayload,
    @Ctx() context?: RmqContext,
  ): Promise<void> {
    const documentId = payload?.documentId?.trim();
    const businessId = payload?.businessId?.trim();

    if (!documentId || !businessId) {
      this.logger.error(
        `Received ${KNOWLEDGE_DELETION_EVENT} with an invalid payload`,
      );
      acknowledgeRabbitMqMessage(context, this.logger);
      return;
    }

    try {
      await this.documentDeletion.processDocumentDeletion(
        businessId,
        documentId,
      );
      acknowledgeRabbitMqMessage(context, this.logger);
    } catch (error) {
      const details = getErrorDetails(error);
      this.logger.error(
        `Knowledge deletion consumer failed businessId=${businessId} documentId=${documentId}: ${details.message}`,
        details.stack,
      );
      requeueRabbitMqMessage(context, this.logger);
    }
  }
}
