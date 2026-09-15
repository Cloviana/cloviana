import { PartialType } from "@nestjs/mapped-types";
import { PromptAwarenessStage, PromptBranding } from "@prisma/client";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreatePromptDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @IsEnum(PromptAwarenessStage)
  stage!: PromptAwarenessStage;

  @IsBoolean()
  active!: boolean;

  @IsEnum(PromptBranding)
  branding!: PromptBranding;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  topicIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  tagIds?: string[];
}

export class UpdatePromptDto extends PartialType(CreatePromptDto) {}

export class BulkDeletePromptsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  promptIds!: string[];
}

export class BulkUpdatePromptsDto extends BulkDeletePromptsDto {
  @IsBoolean()
  active!: boolean;
}
