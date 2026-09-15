import { WorkflowRunsModule } from "@/modules/workflow-runs/workflow-runs.module";
import { Module } from "@nestjs/common";
import { ProductResearchService } from "./product-research.service";
import { ProductResearchWorkflow } from "./product-research.workflow";

@Module({
  imports: [WorkflowRunsModule],
  providers: [ProductResearchService, ProductResearchWorkflow],
  exports: [ProductResearchService, ProductResearchWorkflow],
})
export class ProductResearchWorkflowModule {}
