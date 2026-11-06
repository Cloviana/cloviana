import { IsString, MaxLength, MinLength } from "class-validator";

export class AcceptInviteDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  token!: string;
}
