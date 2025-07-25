import { IsString, Matches, MinLength } from "class-validator";

export class CreateStoreDto {
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name: string;

  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: "Please enter a valid domain name (e.g. example.com)",
  })
  domainUrl: string;
}
