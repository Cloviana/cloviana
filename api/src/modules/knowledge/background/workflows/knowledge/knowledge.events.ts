import { InngestService } from "@/infrastructure/inngest/inngest.service";
import { Injectable } from "@nestjs/common";
import { eventType, staticSchema } from "inngest";

export interface KnowledgeDocumentEventData extends Record<string, unknown> {
  documentId: string;
  businessId: string;
}

export const knowledgeIngestionRequested = eventType(
  "knowledge/ingestion.requested",
  { schema: staticSchema<KnowledgeDocumentEventData>() },
);

export const knowledgeDeletionRequested = eventType(
  "knowledge/deletion.requested",
  { schema: staticSchema<KnowledgeDocumentEventData>() },
);

@Injectable()
export class KnowledgeEventsService {
  constructor(private readonly inngestService: InngestService) {}

  enqueueIngestion(data: KnowledgeDocumentEventData) {
    return this.inngestService.send({
      name: knowledgeIngestionRequested.name,
      data,
    });
  }

  enqueueDeletion(data: KnowledgeDocumentEventData) {
    return this.inngestService.send({
      name: knowledgeDeletionRequested.name,
      data,
    });
  }
}
