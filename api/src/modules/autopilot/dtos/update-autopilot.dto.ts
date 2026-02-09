import { AutopilotContentMix, DayOfWeek } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";

class UpdateAutopilotBlogDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  collectionIds: string[] = [];

  @IsEnum(AutopilotContentMix)
  contentMix: AutopilotContentMix;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  publishDays: DayOfWeek[] = [];

  @IsBoolean()
  autoPublish: boolean;
}

export class UpdateAutopilotDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAutopilotBlogDto)
  blog?: UpdateAutopilotBlogDto;
}
