import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

export class ShopifyStartDto {
  @IsOptional()
  @IsString()
  hmac?: string

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @Matches(/^([a-z0-9][a-z0-9-]+)\.myshopify\.com$/)
  shop: string
}