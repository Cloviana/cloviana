import { ClaimSentiment } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export class GetPromptBrandPerceptionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ClaimSentiment)
  sentiment?: ClaimSentiment;
}
