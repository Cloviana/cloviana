import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export const SELLER_STATUS_FILTERS = [
  "ACTIVE",
  "PENDING",
  "SUSPENDED",
  "TERMINATED",
  "ALL",
] as const;

export class ListSellersDto {
  // Defaults to ACTIVE so the seller picker keeps working; the stores table asks for ALL.
  @IsOptional()
  @IsIn(SELLER_STATUS_FILTERS)
  status?: (typeof SELLER_STATUS_FILTERS)[number];

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
