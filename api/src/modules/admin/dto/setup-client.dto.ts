import { BUSINESS_INDUSTRIES } from "@/modules/businesses/dto/update-business-setup-profile.dto";
import { PromptAwarenessStage } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class SetupClientCompetitorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: "Please enter a valid competitor domain",
  })
  domain: string;
}

export class SetupClientPromptDto {
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  text: string;

  @IsOptional()
  @IsEnum(PromptAwarenessStage)
  stage?: PromptAwarenessStage;
}

export class SetupClientTopicDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SetupClientPromptDto)
  prompts: SetupClientPromptDto[];
}

export class SetupClientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(12, { message: "Password must be at least 12 characters" })
  password?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  brandName: string;

  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: "Please enter a valid business domain",
  })
  domain: string;

  @IsOptional()
  @IsString()
  @MaxLength(500000)
  profileUrl?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location: string;

  @IsString()
  @Matches(/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/, {
    message: "Please select a valid IANA time zone",
  })
  timezone: string;

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

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SetupClientCompetitorDto)
  competitors: SetupClientCompetitorDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => SetupClientTopicDto)
  topics: SetupClientTopicDto[];
}
