import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GetPromptBrandPerceptionQueryDto } from "../dto/get-prompt-brand-perception-query.dto";
import { GetPromptMentionRateQueryDto } from "../dto/get-prompt-mention-rate-query.dto";
import { GetPromptRankingQueryDto } from "../dto/get-prompt-ranking-query.dto";
import {
  GetPromptSourceTypesQueryDto,
  GetPromptSourcesQueryDto,
} from "../dto/get-prompt-source-distribution-query.dto";
import { ListPromptsQueryDto } from "../dto/list-prompts-query.dto";
import { PaginationQueryDto } from "../dto/pagination-query.dto";
import {
  BulkDeletePromptsDto,
  BulkUpdatePromptsDto,
  CreatePromptDto,
  UpdatePromptDto,
} from "../dto/prompt.dto";
import { PromptsService } from "../services/prompts.service";

@Controller("businesses/:businessId/prompts")
@UseGuards(BusinessAccessGuard)
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  getPrompts(
    @Param("businessId") businessId: string,
    @Query() query: ListPromptsQueryDto,
  ) {
    return this.promptsService.getPrompts(businessId, query);
  }

  @Get("options")
  getPromptOptions(@Param("businessId") businessId: string) {
    return this.promptsService.getPromptOptions(businessId);
  }

  @Get(":promptId/fan-out-queries")
  getPromptFanOutQueries(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.promptsService.getPromptFanOutQueries(
      businessId,
      promptId,
      query,
    );
  }

  @Get(":promptId/brand-perception")
  getPromptBrandPerception(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptBrandPerceptionQueryDto,
  ) {
    return this.promptsService.getPromptBrandPerception(
      businessId,
      promptId,
      query,
    );
  }

  @Get(":promptId/metrics/mention-rate")
  getPromptMentionRate(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptMentionRateQueryDto,
  ) {
    return this.promptsService.getPromptMentionRate(
      businessId,
      promptId,
      query,
    );
  }

  @Get(":promptId/metrics/ranking")
  getPromptRanking(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptRankingQueryDto,
  ) {
    return this.promptsService.getPromptRanking(businessId, promptId, query);
  }

  @Get(":promptId/metrics/source-domains")
  getPromptSourceDomains(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptSourcesQueryDto,
  ) {
    return this.promptsService.getPromptSourceDomains(
      businessId,
      promptId,
      query,
    );
  }

  @Get(":promptId/metrics/domain-types")
  getPromptDomainTypes(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptSourceTypesQueryDto,
  ) {
    return this.promptsService.getPromptDomainTypes(
      businessId,
      promptId,
      query,
    );
  }

  @Get(":promptId/metrics/source-urls")
  getPromptSourceUrls(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptSourcesQueryDto,
  ) {
    return this.promptsService.getPromptSourceUrls(businessId, promptId, query);
  }

  @Get(":promptId/metrics/url-types")
  getPromptUrlTypes(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Query() query: GetPromptSourceTypesQueryDto,
  ) {
    return this.promptsService.getPromptUrlTypes(businessId, promptId, query);
  }

  @Get(":promptId")
  getPrompt(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
  ) {
    return this.promptsService.getPrompt(businessId, promptId);
  }

  @Post()
  createPrompt(
    @Param("businessId") businessId: string,
    @Body() body: CreatePromptDto,
  ) {
    return this.promptsService.createPrompt(businessId, body);
  }

  @Patch(":promptId")
  updatePrompt(
    @Param("businessId") businessId: string,
    @Param("promptId", new ParseUUIDPipe({ version: "4" })) promptId: string,
    @Body() body: UpdatePromptDto,
  ) {
    return this.promptsService.updatePrompt(businessId, promptId, body);
  }

  @Patch()
  setPromptsActive(
    @Param("businessId") businessId: string,
    @Body() body: BulkUpdatePromptsDto,
  ) {
    return this.promptsService.setPromptsActive(
      businessId,
      body.promptIds,
      body.active,
    );
  }

  @Delete()
  deletePrompts(
    @Param("businessId") businessId: string,
    @Body() body: BulkDeletePromptsDto,
  ) {
    return this.promptsService.deletePrompts(businessId, body.promptIds);
  }
}
