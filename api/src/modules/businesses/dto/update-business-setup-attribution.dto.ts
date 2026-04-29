import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateBusinessSetupAttributionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  heardAboutUs: string;
}
