import { IsEmail } from "class-validator";

export class CreateBusinessInviteDto {
  @IsEmail()
  email!: string;
}
