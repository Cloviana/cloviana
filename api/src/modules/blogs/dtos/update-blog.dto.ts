import { GenerationStep } from "@prisma/client";
import { IsString, IsOptional, IsEnum } from "class-validator";

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

  @IsEnum(GenerationStep)
  @IsOptional()
  generationStep?: GenerationStep;
}