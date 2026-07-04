import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { BlogsController } from "./blogs.controller";
import { BlogsService } from "./blogs.service";

@Module({
  imports: [JobsModule],
  controllers: [BlogsController],
  providers: [BusinessAccessGuard, BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}
