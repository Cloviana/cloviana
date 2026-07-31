import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { MonitoringQueueModule } from "./background/queue/monitoring-queue.module";
import { MonitoringController } from "./monitoring.controller";
import { MonitoringEligibilityService } from "./services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "./services/monitoring-enqueue.service";

@Module({
  imports: [JobsModule, MonitoringQueueModule],
  controllers: [MonitoringController],
  providers: [
    BusinessAccessGuard,
    MonitoringEligibilityService,
    MonitoringEnqueueService,
  ],
})
export class MonitoringModule {}
