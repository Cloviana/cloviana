import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { KnowledgeQueueModule } from "./background/queue/knowledge-queue.module";
import { DocumentsController } from "./documents/documents.controller";
import { DocumentsService } from "./documents/documents.service";
import { FoldersController } from "./folders/folders.controller";
import { FoldersService } from "./folders/folders.service";
import { KnowledgeBaseClient } from "./knowledge-base.client";
import { KnowledgeSearchController } from "./search/knowledge-search.controller";
import { KnowledgeSearchService } from "./search/knowledge-search.service";

@Module({
  imports: [KnowledgeQueueModule],
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
    BusinessAccessGuard,
  ],
})
export class KnowledgeModule {}
