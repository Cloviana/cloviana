import { IsString, IsNotEmpty, Matches } from 'class-validator'
import { Transform } from 'class-transformer'

export class ShopifyCallbackDto {
  @IsString()
  @IsNotEmpty()
  hmac: string

  @IsString()
  @IsNotEmpty()
  host: string 

  @IsString()
  @IsNotEmpty()
  timestamp: string 

  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @Matches(/^([a-z0-9][a-z0-9-]+)\.myshopify\.com$/)
  shop: string

  @IsString()
  @IsNotEmpty()
  state: string
}
