import { IsString, IsOptional, IsEnum, IsUUID } from "class-validator";
import { BlogType } from "@prisma/client";

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  brandVoice?: string;

  @IsEnum(BlogType)
  type: BlogType;

  @IsUUID()
  keywordId: string;

  @IsString()
  storeId: string;
}
