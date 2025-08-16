import { NodeType } from "@prisma/client";
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from "class-validator";

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
