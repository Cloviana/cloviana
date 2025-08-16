import { IsString, Matches, MinLength } from "class-validator";

export class CreateChannelDto {
  @IsString()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, {
    message: "Please enter a valid shop domain (e.g. example.myshopify.com)",
  })
  shop!: string;

  @IsString()
  @MinLength(10, { message: "Offline access token seems too short" })
  offlineAccessToken!: string;
}
