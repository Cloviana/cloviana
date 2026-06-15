import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class StartBusinessSetupDto {
  @IsEmail()
  workEmail: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  brandName: string;

  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: "Please enter a valid domain name (e.g. example.com)",
  })
  domain: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location: string;

  @IsString()
  @Matches(/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/, {
    message: "Please select a valid IANA time zone",
  })
  timezone: string;
}
