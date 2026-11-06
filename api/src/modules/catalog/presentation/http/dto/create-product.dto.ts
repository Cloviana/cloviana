import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import {
  CREATABLE_PRODUCT_STATUSES,
  type CreateProductStatus,
} from "@/modules/catalog/domain/product";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;
const uppercaseSku = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

export class CreateProductMediaItemDto {
  @IsUUID() assetId!: string;
}

export class ProductOptionDto {
  @IsOptional()
  @IsUUID()
  persistedId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("all", { each: true })
  valueKeys?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(trim)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(255, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((entry: unknown) =>
          typeof entry === "string" ? entry.trim() : entry,
        )
      : value,
  )
  values!: string[];
}

export class ProductOfferDto {
  @IsUUID()
  sellerId!: string;

  @IsString()
  @IsNotEmpty()
  variantKey!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(uppercaseSku)
  sku?: string;

  @IsString()
  @MaxLength(16)
  @Matches(/^\d+(?:\.\d*)?$/)
  @Transform(trim)
  price!: string;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  initialStock!: number;
}

export class ProductVariantEditDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(uppercaseSku)
  sku?: string | null;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(trim)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "handle must be lowercase letters, numbers and hyphens",
  })
  @Transform(trim)
  handle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  seoDescription?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantEditDto)
  variants?: ProductVariantEditDto[];

  @IsOptional()
  @IsIn(CREATABLE_PRODUCT_STATUSES)
  status?: CreateProductStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("all", { each: true })
  collectionIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options?: ProductOptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOfferDto)
  offers!: ProductOfferDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(0, {
    message: "Upload files to the library before attaching them to a product.",
  })
  media?: unknown[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => CreateProductMediaItemDto)
  mediaItems?: CreateProductMediaItemDto[];
}
