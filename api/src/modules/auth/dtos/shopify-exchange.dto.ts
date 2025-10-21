import { Transform } from "class-transformer";
import { IsString, Matches } from "class-validator";

export class ShopifyExchangeDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @Matches(/^(?!https?:\/\/)(?!-)[a-z0-9-]{1,63}(?<!-)\.myshopify\.com$/)
  shop!: string;

  @Transform(({ value }) => String(value).trim())
  @IsString()
  code!: string;

  @Transform(({ value }) => String(value).trim())
  @Matches(/^[a-f0-9]{32}$/i)
  state!: string;
}
