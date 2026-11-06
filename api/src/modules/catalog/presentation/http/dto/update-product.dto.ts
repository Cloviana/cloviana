import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsISO8601,
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

import type { ProductStatus } from "@/modules/catalog/domain/product";
import { ProductOptionDto, ProductVariantEditDto } from "./create-product.dto";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateProductOptionDto extends ProductOptionDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  valueIds?: (string | null)[];
}

export class UpdateProductMediaDto {
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  id?: string;
}

export class UpdateProductOfferDto {
  @IsOptional()
  @IsUUID()
  persistedId?: string;

  @IsUUID()
  sellerId!: string;

  @IsString()
  @IsNotEmpty()
  variantKey!: string;

  @IsString()
  @MaxLength(16)
  @Matches(/^\d+(?:\.\d*)?$/)
  @Transform(trim)
  price!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  quantity?: number;

  @IsOptional()
  @IsISO8601()
  inventoryUpdatedAt?: string | null;
}

export class UpdateProductDto {
  @IsISO8601()
  expectedUpdatedAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(trim)
  title!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  handle?: string;

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

  @IsIn(["DRAFT", "PUBLISHED", "UNLISTED", "PROPOSED", "REJECTED", "ARCHIVED"])
  status!: ProductStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsArray()
  @ArrayUnique()
  @IsUUID("all", { each: true })
  collectionIds!: string[];

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionDto)
  options!: UpdateProductOptionDto[];

  @IsArray()
  @ArrayMaxSize(9)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductMediaDto)
  media!: UpdateProductMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOfferDto)
  offers?: UpdateProductOfferDto[];
}
