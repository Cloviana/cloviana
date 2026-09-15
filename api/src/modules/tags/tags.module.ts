import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { TagsController } from "./tags.controller";
import { TagsService } from "./tags.service";

@Module({
  controllers: [TagsController],
  providers: [TagsService, BusinessAccessGuard],
})
export class TagsModule {}
