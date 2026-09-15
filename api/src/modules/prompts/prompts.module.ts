import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { PromptResponsesController } from "./controllers/prompt-responses.controller";
import { PromptsController } from "./controllers/prompts.controller";
import { PromptResponsesService } from "./services/prompt-responses.service";
import { PromptsService } from "./services/prompts.service";

@Module({
  controllers: [PromptsController, PromptResponsesController],
  providers: [PromptsService, PromptResponsesService, BusinessAccessGuard],
})
export class PromptsModule {}
