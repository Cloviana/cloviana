import { IsObject } from "class-validator";

export class SyncLexicalDto {
  @IsObject()
  state!: Record<string, any>;
}
