import { Module } from "@nestjs/common";
import { KnowledgeBaseClient } from "../knowledge-base.client";
import { DocumentDeletionService } from "./document-deletion.service";
import { DocumentIngestionService } from "./document-ingestion.service";
import { KnowledgeRecoveryService } from "./knowledge-recovery.service";
import { KnowledgeQueueModule } from "./queue/knowledge-queue.module";
import { KnowledgeConsumer } from "./queue/knowledge.consumer";

@Module({
  imports: [KnowledgeQueueModule],
  controllers: [KnowledgeConsumer],
  providers: [
    KnowledgeBaseClient,
    DocumentIngestionService,
    DocumentDeletionService,
    KnowledgeRecoveryService,
  ],
})
export class KnowledgeBackgroundModule {}
