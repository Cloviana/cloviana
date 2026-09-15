import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { TagsService } from "./tags.service";

@Controller("businesses/:businessId/tags")
@UseGuards(BusinessAccessGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  getTags(@Param("businessId") businessId: string) {
    return this.tagsService.getTags(businessId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTag(
    @Param("businessId") businessId: string,
    @Body() body: CreateTagDto,
  ) {
    return this.tagsService.createTag(businessId, body.text);
  }

  @Delete(":tagId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTag(
    @Param("businessId") businessId: string,
    @Param("tagId", new ParseUUIDPipe({ version: "4" })) tagId: string,
  ) {
    await this.tagsService.deleteTag(businessId, tagId);
  }
}
