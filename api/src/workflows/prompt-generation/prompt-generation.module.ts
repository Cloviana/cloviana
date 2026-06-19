import { GroqModule } from "@/clients/groq/groq.module";
import { ExaModule } from "@/integrations/exa/exa.module";
import { JobsModule } from "@/modules";
import { Module } from "@nestjs/common";
import { PromptGenerationWorkflow } from "./prompt-generation.workflow";

@Module({
  imports: [JobsModule, ExaModule, GroqModule],
  providers: [PromptGenerationWorkflow],
  exports: [PromptGenerationWorkflow],
})
export class PromptGenerationWorkflowModule {}
