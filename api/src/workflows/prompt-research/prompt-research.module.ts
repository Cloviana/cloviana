import { ExaModule } from "@/integrations/exa/exa.module";
import { JobsModule } from "@/modules";
import { BusinessesModule } from "@/modules/businesses/businesses.module";
import { Module } from "@nestjs/common";
import { PromptResearchRunner } from "./prompt-research.runner";
import { PromptResearchWorkflow } from "./prompt-research.workflow";

@Module({
  imports: [ExaModule, BusinessesModule, JobsModule],
  providers: [PromptResearchWorkflow, PromptResearchRunner],
  exports: [PromptResearchWorkflow, PromptResearchRunner],
})
export class PromptResearchWorkflowModule {}
