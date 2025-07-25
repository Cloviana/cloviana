import { KeywordType } from "@prisma/client";
import { IsEnum } from "class-validator";

export class GetKeywordsQueryDto {
  @IsEnum(KeywordType)
    type!: KeywordType;
}
