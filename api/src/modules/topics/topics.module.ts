import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";

@Module({
  controllers: [TopicsController],
  providers: [TopicsService, BusinessAccessGuard],
})
export class TopicsModule {}
