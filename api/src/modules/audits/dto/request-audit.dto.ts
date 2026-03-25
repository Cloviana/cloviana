import { normalizeDomain } from "@/workflows/audit/utils/normalize-domain";
import { Transform } from "class-transformer";
import { IsEmail, IsISO31661Alpha2, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RequestAuditDto {
  @Transform(({ value }) => normalizeDomain(value))
  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsEmail()
  email: string;

  @IsISO31661Alpha2()
  @IsOptional()
  @Transform(({ value }) => (value ?? "US").toUpperCase())
  country: string = "US";
}
