import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { WorkflowRunsController } from "./workflow-runs.controller";
import { WorkflowRunsService } from "./workflow-runs.service";

@Module({
  providers: [WorkflowRunsService, BusinessAccessGuard],
  controllers: [WorkflowRunsController],
  exports: [WorkflowRunsService],
})
export class WorkflowRunsModule {}
