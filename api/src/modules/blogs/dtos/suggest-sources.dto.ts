import { IsString, IsNotEmpty } from "class-validator";

export class SuggestSourcesDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}
