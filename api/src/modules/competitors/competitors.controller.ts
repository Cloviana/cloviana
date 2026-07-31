import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { CompetitorsService } from "./competitors.service";

class CreateCompetitorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) => normalizeDomain(value))
  @IsString()
  @IsNotEmpty()
  domain!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  aliases!: string[];
}

class UpdateCompetitorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeDomain(value))
  @IsString()
  @IsNotEmpty()
  domain?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  aliases?: string[];
}

@Controller("businesses/:businessId/competitors")
@UseGuards(BusinessAccessGuard)
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Get()
  getCompetitors(@Param("businessId") businessId: string) {
    return this.competitorsService.getCompetitors(businessId);
  }

  @Post()
  createCompetitor(
    @Param("businessId") businessId: string,
    @Body() body: CreateCompetitorDto,
  ) {
    return this.competitorsService.createCompetitor(businessId, body);
  }

  @Patch(":competitorId")
  updateCompetitor(
    @Param("businessId") businessId: string,
    @Param("competitorId") competitorId: string,
    @Body() body: UpdateCompetitorDto,
  ) {
    return this.competitorsService.updateCompetitor(
      businessId,
      competitorId,
      body,
    );
  }

  @Delete(":competitorId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompetitor(
    @Param("businessId") businessId: string,
    @Param("competitorId") competitorId: string,
  ) {
    await this.competitorsService.deleteCompetitor(businessId, competitorId);
  }
}
