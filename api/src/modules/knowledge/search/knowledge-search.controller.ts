import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { KnowledgeSearchService } from "./knowledge-search.service";

class SearchKnowledgeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  query!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID(undefined, { each: true })
  folderIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

@Controller("businesses/:businessId/knowledge")
@UseGuards(BusinessAccessGuard)
export class KnowledgeSearchController {
  constructor(private readonly searchService: KnowledgeSearchService) {}

  @Post("search")
  searchKnowledge(
    @Param("businessId") businessId: string,
    @Body() body: SearchKnowledgeDto,
  ) {
    return this.searchService.searchKnowledge(businessId, body);
  }
}
