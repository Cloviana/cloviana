import { IsString, Length } from "class-validator";

export class ValidateTokenDto {
  @IsString()
  @Length(10, 200)
  token: string;
}
