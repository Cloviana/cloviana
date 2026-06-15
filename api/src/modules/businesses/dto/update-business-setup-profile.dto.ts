import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export const BUSINESS_INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Agency",
  "Fintech",
  "Healthcare",
  "Professional Services",
  "Other",
] as const;

export class UpdateBusinessSetupProfileDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsIn(BUSINESS_INDUSTRIES)
  industry: (typeof BUSINESS_INDUSTRIES)[number];

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  category: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @Type(() => String)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(80, { each: true })
  distributionChannels: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  searchIntentCommercial: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  searchIntentInformational: number;
}
