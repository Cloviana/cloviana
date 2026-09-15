import { IsDateString, IsEnum, IsOptional, Matches } from "class-validator";

export enum MentionRateGranularity {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export class GetPromptMentionRateQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to!: string;

  @IsOptional()
  @IsEnum(MentionRateGranularity)
  granularity: MentionRateGranularity = MentionRateGranularity.DAY;
}
