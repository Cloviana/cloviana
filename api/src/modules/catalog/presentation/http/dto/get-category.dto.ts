import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class GetCategoryDto {
  // Query strings are text, so "false" must not become true through implicit conversion.
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === "true" || value === true,
  )
  @IsBoolean()
  includeHidden?: boolean;
}
