import { AnthropicModule } from "@/clients/anthropic/anthropic.module";
import { GroqModule } from "@/clients/groq/groq.module";
import { OpenAIModule } from "@/clients/openai/openai.module";
import { ExaModule } from "@/integrations/exa/exa.module";
import { Module } from "@nestjs/common";
import { PromptGenerationWorkflow } from "./prompt-generation.workflow";

@Module({
  imports: [ExaModule, GroqModule, OpenAIModule, AnthropicModule],
  providers: [PromptGenerationWorkflow],
  exports: [PromptGenerationWorkflow],
})
export class PromptGenerationWorkflowModule {}
