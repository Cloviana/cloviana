import {
  BULK_PRODUCT_STATUSES,
  type BulkProductStatus,
} from "@/modules/catalog/domain/product";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsIn,
  IsUUID,
} from "class-validator";

export class SetProductsStatusDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids!: string[];

  @IsIn(BULK_PRODUCT_STATUSES)
  status!: BulkProductStatus;
}
