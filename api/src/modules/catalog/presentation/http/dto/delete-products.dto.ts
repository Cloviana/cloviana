import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsUUID,
} from "class-validator";

export class DeleteProductsDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids!: string[];
}
