import { Module } from "@nestjs/common";
import { AutopilotBlogModule } from "@/workflows/autopilot-blog/autopilot-blog.module";

import { AutopilotController } from "./autopilot.controller";
import { BlogAutopilotScheduler } from "./schedules/blog-autopilot.scheduler";
import { AutopilotService } from "./autopilot.service";

@Module({
  imports: [AutopilotBlogModule],
  controllers: [AutopilotController],
  providers: [AutopilotService, BlogAutopilotScheduler],
  exports: [AutopilotService],
})
export class AutopilotModule {}
