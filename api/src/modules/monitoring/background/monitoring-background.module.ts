import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { MonitoringEligibilityService } from "../services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "../services/monitoring-enqueue.service";
import { MonitoringQueueModule } from "./queue/monitoring-queue.module";
import { MonitoringConsumer } from "./queue/monitoring.consumer";
import { MonitoringScheduler } from "./schedulers/monitoring.scheduler";
import { MonitoringWorkflowModule } from "./workflows/monitoring/monitoring-workflow.module";

@Module({
  imports: [JobsModule, MonitoringQueueModule, MonitoringWorkflowModule],
  controllers: [MonitoringConsumer],
  providers: [
    MonitoringEligibilityService,
    MonitoringEnqueueService,
    MonitoringScheduler,
  ],
})
export class MonitoringBackgroundModule {}
