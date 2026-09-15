import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { OmitType, PartialType } from "@nestjs/mapped-types";
import { RuleScope, SampleKind } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

class OptionalIdDto {
  @IsOptional()
  @IsUUID("4")
  id?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeDomain(value))
  @IsString()
  @MinLength(1)
  @MaxLength(253)
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  about?: string | null;
}

export class UpdateVoiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  voice?: string | null;
}

export class UpdateWriterPersonaDto {
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  writerPersona?: string | null;
}

export class CreateProductDto extends OptionalIdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  positioning?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  idealCustomer?: string | null;
}

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ["id"] as const),
) {}

export class CreateCompetitorDto extends OptionalIdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @Transform(({ value }) => normalizeDomain(value))
  @IsString()
  @MinLength(1)
  @MaxLength(253)
  domain!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  aliases?: string[];
}

export class UpdateCompetitorDto extends PartialType(
  OmitType(CreateCompetitorDto, ["id"] as const),
) {}

export class CreateContentTypeDto extends OptionalIdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ctaUrl?: string | null;
}

export class UpdateContentTypeDto extends PartialType(
  OmitType(CreateContentTypeDto, ["id"] as const),
) {}

export class CreateAudienceDto extends OptionalIdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

export class UpdateAudienceDto extends PartialType(
  OmitType(CreateAudienceDto, ["id"] as const),
) {}

export class CreateRegionDto extends OptionalIdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

export class UpdateRegionDto extends PartialType(
  OmitType(CreateRegionDto, ["id"] as const),
) {}

export class CreateCustomVariableDto extends OptionalIdDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  value?: string | null;
}

export class UpdateCustomVariableDto extends PartialType(
  OmitType(CreateCustomVariableDto, ["id"] as const),
) {}

export class CreateRuleDto extends OptionalIdDto {
  @IsEnum(RuleScope)
  scope!: RuleScope;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsUUID("4")
  audienceId?: string | null;

  @IsOptional()
  @IsUUID("4")
  regionId?: string | null;

  @IsOptional()
  @IsUUID("4")
  contentTypeId?: string | null;
}

export class UpdateRuleDto extends PartialType(
  OmitType(CreateRuleDto, ["id"] as const),
) {}

export class CreateSampleDto extends OptionalIdDto {
  @IsUUID("4")
  contentTypeId!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  audienceIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  regionIds?: string[];

  @IsEnum(SampleKind)
  kind!: SampleKind;

  @IsString()
  @MinLength(1)
  value!: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateSampleDto extends PartialType(
  OmitType(CreateSampleDto, ["id"] as const),
) {}
