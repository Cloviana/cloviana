import { IsEmail } from "class-validator";

export class CheckAuthAccessDto {
  @IsEmail()
  email!: string;
}
