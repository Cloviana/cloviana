import { PromptAwarenessStage } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class ApprovedPromptDto {
  @IsString()
  @MaxLength(120)
  clusterId: string;

  @IsString()
  @MinLength(8)
  @MaxLength(500)
  text: string;

  @IsEnum(PromptAwarenessStage)
  stage: PromptAwarenessStage;
}

export class CompleteBusinessSetupDto {
  @IsArray()
  @ArrayMinSize(3, { message: "Approve at least 3 prompts" })
  @ArrayMaxSize(50, { message: "Approve no more than 50 prompts" })
  @ValidateNested({ each: true })
  @Type(() => ApprovedPromptDto)
  prompts: ApprovedPromptDto[];
}
