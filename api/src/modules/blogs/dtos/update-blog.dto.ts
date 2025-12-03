import { BlogSetupStep, SearchIntent, WordCountPreset } from "@prisma/client";
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

  @IsString()
  @IsOptional()
  additionalInstruction?: string;

  @IsString()
  @IsOptional()
  targetPersona?: string;

  @IsEnum(WordCountPreset)
  @IsOptional()
  wordCount?: WordCountPreset;

  @IsEnum(SearchIntent)
  @IsOptional()
  searchIntent?: SearchIntent;

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

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  collectionIds?: string[];

  @IsEnum(BlogSetupStep)
  @IsOptional()
  currentStep?: BlogSetupStep;
}
