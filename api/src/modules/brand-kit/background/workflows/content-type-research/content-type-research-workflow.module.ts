import { ExaModule } from "@/integrations/exa/exa.module";
import { WorkflowRunsModule } from "@/modules/workflow-runs/workflow-runs.module";
import { Module } from "@nestjs/common";
import { ContentTypeResearchService } from "./content-type-research.service";
import { ContentTypeResearchWorkflow } from "./content-type-research.workflow";

@Module({
  imports: [WorkflowRunsModule, ExaModule],
  providers: [ContentTypeResearchService, ContentTypeResearchWorkflow],
  exports: [ContentTypeResearchService, ContentTypeResearchWorkflow],
})
export class ContentTypeResearchWorkflowModule {}
