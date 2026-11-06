import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateCategoryDto {
  @IsISO8601()
  expectedUpdatedAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  handle!: string;

  // Null moves the category to the top level.
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  description?: string | null;

  @IsBoolean()
  isActive!: boolean;

  @IsBoolean()
  isInternal!: boolean;
}
