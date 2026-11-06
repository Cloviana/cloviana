import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { MAX_SOURCE_PATH_CHARACTERS } from "../../../domain/workspace.policy";

export class FileQuery {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_SOURCE_PATH_CHARACTERS)
  path!: string;
}
export class NavigateDto {
  @IsUUID() expectedRevisionId!: string;
}
