import {
  BlogContentType,
  BlogSetupStep,
  SearchIntent,
  WordCountPreset,
} from "@prisma/client";
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateBlogDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  brandVoice?: string;

  @IsEnum(BlogContentType)
  @IsOptional()
  contentType?: BlogContentType;

  @IsString()
  @IsOptional()
  primaryKeyword?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  productIds?: string[];

  @IsEnum(BlogSetupStep)
  @IsOptional()
  currentStep?: BlogSetupStep;
}
