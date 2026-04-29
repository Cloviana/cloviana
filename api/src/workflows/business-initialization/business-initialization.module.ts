import { JobsModule } from "@/modules";
import { PromptResearchWorkflowModule } from "@/workflows/prompt-research";
import { Module } from "@nestjs/common";
import { BusinessInitializationWorkflow } from "./business-initialization.workflow";

@Module({
  imports: [JobsModule, PromptResearchWorkflowModule],
  providers: [BusinessInitializationWorkflow],
  exports: [BusinessInitializationWorkflow],
})
export class BusinessInitializationWorkflowModule {}
