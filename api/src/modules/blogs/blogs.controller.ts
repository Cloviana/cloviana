import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString, Length } from "class-validator";
import { BlogsService } from "./blogs.service";

class GenerateBlogDto {
  @IsString()
  @Length(1, 500)
  topic!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  instructions?: string;
}

@Controller("businesses/:businessId/blogs")
@UseGuards(BusinessAccessGuard)
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}

  @Post("generate")
  @HttpCode(HttpStatus.ACCEPTED)
  generate(
    @Param("businessId") businessId: string,
    @Body() dto: GenerateBlogDto,
  ) {
    return this.blogs.generate(businessId, dto.topic, dto.instructions);
  }

  @Get("drafts")
  listDrafts(@Param("businessId") businessId: string) {
    return this.blogs.listDrafts(businessId);
  }

  @Get("drafts/:draftId")
  getDraft(
    @Param("businessId") businessId: string,
    @Param("draftId") draftId: string,
  ) {
    return this.blogs.getDraft(businessId, draftId);
  }
}
