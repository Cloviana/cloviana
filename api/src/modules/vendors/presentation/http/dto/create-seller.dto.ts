import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import { HANDLE_PATTERN } from "@/modules/vendors/domain/seller-handle";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
const trimToUndefined = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() || undefined : value;
const lowerEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class CreateSellerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trim)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(HANDLE_PATTERN, {
    message: "handle must be lowercase letters, numbers and single dashes",
  })
  @Transform(trimToUndefined)
  handle?: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(lowerEmail)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(trimToUndefined)
  phone?: string;

  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: "currencyCode must be 3 letters" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  currencyCode!: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(lowerEmail)
  adminEmail!: string;
}
