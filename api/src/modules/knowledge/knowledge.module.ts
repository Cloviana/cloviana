import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeService } from "./knowledge.service";

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService, BusinessAccessGuard],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
