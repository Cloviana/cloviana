import { IsString, Matches } from "class-validator";

export class StartBusinessSetupDto {
  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: "Please enter a valid domain name (e.g. example.com)",
  })
  domain: string;
}
