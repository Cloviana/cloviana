import { IsString, IsNotEmpty, Matches } from 'class-validator'
import { Transform } from 'class-transformer'

export class ShopifyInstallDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @Matches(/^([a-z0-9][a-z0-9-]+)\.myshopify\.com$/)
  shop: string

  @IsString()
  storeId: string
}