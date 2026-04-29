import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class UpdateBusinessSetupCompetitorsDto {
  @IsArray()
  @ArrayMinSize(3, { message: "Please add at least 3 competitors" })
  @ArrayMaxSize(5, { message: "Please add no more than 5 competitors" })
  @Type(() => String)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    each: true,
    message: "Each competitor must be a valid domain name",
  })
  competitors: string[];
}
