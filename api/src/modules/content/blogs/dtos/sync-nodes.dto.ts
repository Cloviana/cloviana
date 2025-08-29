import { IsArray, ValidateNested, IsEnum, IsInt, IsObject, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { NodeType } from "@prisma/client";

export class UpdateNodeDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  parentKey?: string | null;

  @IsEnum(NodeType)
  type: NodeType;

  @IsInt()
  sortOrder: number;

  @IsObject()
  payload: Record<string, any>;
}

export class SyncNodesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateNodeDto)
  nodes!: UpdateNodeDto[];
}
