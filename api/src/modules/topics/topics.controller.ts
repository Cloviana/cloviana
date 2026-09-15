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
import { CreateTopicDto } from "./dto/create-topic.dto";
import { TopicsService } from "./topics.service";

@Controller("businesses/:businessId/topics")
@UseGuards(BusinessAccessGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  getTopics(@Param("businessId") businessId: string) {
    return this.topicsService.getTopics(businessId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTopic(
    @Param("businessId") businessId: string,
    @Body() body: CreateTopicDto,
  ) {
    return this.topicsService.createTopic(businessId, body.name);
  }

  @Delete(":topicId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTopic(
    @Param("businessId") businessId: string,
    @Param("topicId", new ParseUUIDPipe({ version: "4" })) topicId: string,
  ) {
    await this.topicsService.deleteTopic(businessId, topicId);
  }
}
