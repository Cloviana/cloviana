import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import {
  PRODUCT_STATUSES,
  type ProductStatus,
} from "@/modules/catalog/domain/product";

const UUID_OR_NONE =
  /^(none|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Lists arrive as one comma-separated parameter, such as `status=DRAFT,PUBLISHED`.
const split = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.split(",").filter(Boolean) : value;

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() || undefined : value;

export class ListProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  q?: string;

  @IsOptional()
  @Transform(split)
  @IsArray()
  @ArrayMaxSize(PRODUCT_STATUSES.length)
  @IsIn(PRODUCT_STATUSES, { each: true })
  status?: ProductStatus[];

  @IsOptional()
  @IsIn(["has", "none"])
  offers?: "has" | "none";

  @IsOptional()
  @Transform(split)
  @IsArray()
  @ArrayMaxSize(50)
  @Matches(UUID_OR_NONE, { each: true })
  category?: string[];

  @IsOptional()
  @IsISO8601()
  updatedFrom?: string;

  @IsOptional()
  @IsISO8601()
  updatedTo?: string;

  @IsOptional()
  @IsISO8601()
  createdFrom?: string;

  @IsOptional()
  @IsISO8601()
  createdTo?: string;
}
