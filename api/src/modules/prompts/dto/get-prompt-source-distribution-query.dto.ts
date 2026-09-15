import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from "class-validator";

export enum PromptSourceView {
  TOP = "top",
  NEW = "new",
  TRENDING = "trending",
  LOSING = "losing",
}

export class GetPromptSourceTypesQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to!: string;
}

export class GetPromptSourcesQueryDto extends GetPromptSourceTypesQueryDto {
  @IsOptional()
  @IsEnum(PromptSourceView)
  view: PromptSourceView = PromptSourceView.TOP;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 8;
}
