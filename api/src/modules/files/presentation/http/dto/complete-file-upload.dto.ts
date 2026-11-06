import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";
export class CompleteFileUploadDto {
  @IsUUID() uploadId!: string;
  @IsString() @MinLength(1) @MaxLength(255) filename!: string;
}
