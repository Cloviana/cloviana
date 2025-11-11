import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class ShopifyStartDto {
  @IsOptional()
  @IsString()
  hmac?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @Matches(/^([a-z0-9][a-z0-9-]+)\.myshopify\.com$/)
  shop: string;
}
