import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { AGENT_MODES, type AgentMode } from "../../../domain/agent-mode";
import {
  MAX_IDEMPOTENCY_KEY_CHARACTERS,
  MAX_PROMPT_CHARACTERS,
} from "../../../domain/agent.policy";
import {
  MAX_REFERENCE_BYTES,
  MAX_REFERENCE_NAME_CHARACTERS,
  MAX_RUN_REFERENCES,
  REFERENCE_MIME_TYPES,
} from "../../../domain/attachment.policy";
import { RUN_CONTEXT_LIMITS } from "../../../domain/run-context";
import { IsSourcePath } from "./is-source-path.decorator";

export class ConversationDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
}
export class SelectionDto {
  @IsSourcePath() path!: string;
  @IsInt() @Min(1) startLine!: number;
  @IsInt() @Min(1) endLine!: number;
  @IsString() @MaxLength(RUN_CONTEXT_LIMITS.selectionText) text!: string;
}
export class RunContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(RUN_CONTEXT_LIMITS.page)
  @Matches(/^\/[^\s]*$/)
  page?: string;
  @IsOptional() @IsSourcePath() file?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => SelectionDto)
  selection?: SelectionDto;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(RUN_CONTEXT_LIMITS.mentions)
  @ArrayUnique()
  @IsSourcePath({ each: true })
  mentions?: string[];
}
export class StartRunDto {
  @IsString() @MinLength(1) @MaxLength(MAX_PROMPT_CHARACTERS) prompt!: string;
  @IsString()
  @MinLength(8)
  @MaxLength(MAX_IDEMPOTENCY_KEY_CHARACTERS)
  idempotencyKey!: string;
  @IsOptional() @IsUUID() themeId?: string;
  @IsOptional() @IsIn(AGENT_MODES) mode?: AgentMode;
  @IsOptional()
  @ValidateNested()
  @Type(() => RunContextDto)
  context?: RunContextDto;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_RUN_REFERENCES)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  attachmentIds?: string[];
}
export class ReferenceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_REFERENCE_NAME_CHARACTERS)
  name!: string;
  @IsIn(REFERENCE_MIME_TYPES) mimeType!: string;
  @IsInt() @Min(1) @Max(MAX_REFERENCE_BYTES) size!: number;
}
export class ConversationQuery {
  @IsOptional() @IsUUID() themeId?: string;
}
export class EventQuery {
  @IsOptional() @IsString() @Matches(/^\d{1,18}$/) after?: string;
}
