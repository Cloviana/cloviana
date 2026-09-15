import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}

export function toPageWindow(query: PaginationQueryDto) {
  const { page, limit } = query;

  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function toPageInfo(page: number, limit: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/**
 * Query strings give one value, many values, or a comma-joined list depending
 * on how the client serialised the array. Normalise all three to a flat array.
 */
export function toArray(value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];

  return values.flatMap((item) =>
    typeof item === "string"
      ? item
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [item],
  );
}
