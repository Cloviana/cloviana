import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { KnowledgeEventsService } from "./background/workflows/knowledge/knowledge.events";
import { KnowledgeWorkflow } from "./background/workflows/knowledge/knowledge.workflow";
import { DocumentsController } from "./documents/documents.controller";
import { DocumentsService } from "./documents/documents.service";
import { FoldersController } from "./folders/folders.controller";
import { FoldersService } from "./folders/folders.service";
import { KnowledgeBaseClient } from "./knowledge-base.client";
import { KnowledgeSearchController } from "./search/knowledge-search.controller";
import { KnowledgeSearchService } from "./search/knowledge-search.service";

@Module({
  controllers: [
    DocumentsController,
    FoldersController,
    KnowledgeSearchController,
  ],
  providers: [
    KnowledgeBaseClient,
    DocumentsService,
    FoldersService,
    KnowledgeSearchService,
    KnowledgeEventsService,
    KnowledgeWorkflow,
    BusinessAccessGuard,
  ],
})
export class KnowledgeModule {}
