import { KeywordType } from "@prisma/client";
import { IsEnum } from "class-validator";

export class AttachKeywordDto {
  @IsEnum(KeywordType)
  type!: KeywordType;
}
