import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsIn,
  IsOptional,
  IsUUID,
} from "class-validator";

export class UpdateSellersDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids!: string[];

  // At least one of status and featured is required (checked in the use case).
  @IsOptional()
  @IsIn(["ACTIVE", "SUSPENDED"])
  status?: "ACTIVE" | "SUSPENDED";

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
