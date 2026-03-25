import { IsEmail, IsNumber } from "class-validator";

export class VerifyAuditDto {
  @IsEmail()
  email: string;

  @IsNumber()
  code: number;
}
