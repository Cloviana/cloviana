import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class ShopifyInstallDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @Matches(/^([a-z0-9][a-z0-9-]+)\.myshopify\.com$/)
  shop: string;

  @IsString()
  storeId: string;
}
