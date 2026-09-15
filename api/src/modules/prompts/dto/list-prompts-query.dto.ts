import { PromptAwarenessStage, PromptBranding } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { PaginationQueryDto, toArray } from "./pagination-query.dto";

export enum PromptStatusFilter {
  ACTIVE = "active",
  ALL = "all",
  INACTIVE = "inactive",
}

export class ListPromptsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PromptStatusFilter)
  status?: PromptStatusFilter;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  topicIds?: string[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  tagIds?: string[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayUnique()
  @IsEnum(PromptBranding, { each: true })
  branding?: PromptBranding[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayUnique()
  @IsEnum(PromptAwarenessStage, { each: true })
  stages?: PromptAwarenessStage[];
}
