import { IsString, Length } from "class-validator";

export class AcceptBetaDto {
  @IsString()
  @Length(10, 200)
  token: string;
}
