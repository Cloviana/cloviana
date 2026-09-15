import { AiEngine } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";
import { PaginationQueryDto, toArray } from "./pagination-query.dto";

export class ListPromptResponsesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayUnique()
  @IsEnum(AiEngine, { each: true })
  engines?: AiEngine[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  promptIds?: string[];

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
  // Read from the raw object because implicit conversion turns both non-empty
  // strings (including "false") into true before exposing `value` here.
  @Transform(({ obj }) => {
    const rawValue = obj.webSearch;

    if (rawValue === undefined || rawValue === "") {
      return undefined;
    }
    if (rawValue === true || rawValue === "true") {
      return true;
    }
    if (rawValue === false || rawValue === "false") {
      return false;
    }

    return rawValue;
  })
  @IsBoolean()
  webSearch?: boolean;
}
