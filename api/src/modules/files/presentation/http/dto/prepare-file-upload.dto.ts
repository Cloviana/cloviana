import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import {
  FILE_UPLOAD_CONTENT_TYPE,
  MAX_FILE_NAME_CHARACTERS,
  MAX_FILE_UPLOAD_BYTES,
} from "../../../domain/file-upload.policy";
export class PrepareFileUploadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_FILE_NAME_CHARACTERS)
  filename!: string;
  @IsString()
  @Matches(FILE_UPLOAD_CONTENT_TYPE)
  contentType!: string;
  @IsInt() @Min(1) @Max(MAX_FILE_UPLOAD_BYTES) size!: number;
}
