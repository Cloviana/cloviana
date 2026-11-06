import { Transform, Type } from "class-transformer";
import {
  Equals,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class ListAttributesDto {
  // This MVP listing exposes reusable variant options only.
  @IsOptional()
  @IsString()
  @Equals("true")
  isVariantAxis?: "true";

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() || undefined : value,
  )
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  offset?: number;
}
