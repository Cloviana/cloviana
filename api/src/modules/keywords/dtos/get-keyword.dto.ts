import { IsString, MinLength } from "class-validator";

export class GetKeywordQueryDto {
  @IsString()
  @MinLength(1)
  phrase!: string;
}
