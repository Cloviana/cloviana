import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from "class-validator";
import { BlogSetupStep } from "@prisma/client";

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
  primaryKeyword?: string;

  @IsOptional()
@IsArray()
@IsString({ each: true })
secondaryKeywords?: string[];

@IsUUID()
  @IsOptional()
  productId?: string;

  @IsEnum(BlogSetupStep)
  @IsOptional()
  currentStep?: BlogSetupStep;
}
