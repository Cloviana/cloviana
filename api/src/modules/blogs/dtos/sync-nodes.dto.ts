import { UpdateNodeDto } from "./update-node.dto";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class SyncNodesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateNodeDto)
  nodes!: UpdateNodeDto[];
}
