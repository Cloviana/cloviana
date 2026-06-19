import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateBusinessSetupTopicsDto {
  @IsArray()
  @ArrayMinSize(1, { message: "Select at least one topic" })
  @ArrayMaxSize(8, { message: "Select no more than 8 topics" })
  @Type(() => String)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  topicIds: string[];
}
