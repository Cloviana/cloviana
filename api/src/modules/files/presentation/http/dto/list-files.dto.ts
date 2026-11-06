import {
  FILE_SORTS,
  type FileSort,
  type FileType,
} from "@/modules/files/domain/file";
import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class ListFilesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  query?: string;
  @IsOptional() @IsIn(["IMAGE", "VIDEO"]) type?: FileType;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minSize?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  maxSize?: number;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsIn(FILE_SORTS) sort?: FileSort;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() @MaxLength(2048) cursor?: string;
}
