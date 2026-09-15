import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ListPromptResponsesQueryDto } from "../dto/list-prompt-responses-query.dto";
import { PromptResponsesService } from "../services/prompt-responses.service";

@Controller("businesses/:businessId/prompts/responses")
@UseGuards(BusinessAccessGuard)
export class PromptResponsesController {
  constructor(
    private readonly promptResponsesService: PromptResponsesService,
  ) {}

  @Get()
  getPromptResponses(
    @Param("businessId") businessId: string,
    @Query() query: ListPromptResponsesQueryDto,
  ) {
    return this.promptResponsesService.getPromptResponses(businessId, query);
  }

  @Get(":responseId")
  getPromptResponse(
    @Param("businessId") businessId: string,
    @Param("responseId", new ParseUUIDPipe({ version: "4" }))
    responseId: string,
  ) {
    return this.promptResponsesService.getPromptResponse(
      businessId,
      responseId,
    );
  }
}
