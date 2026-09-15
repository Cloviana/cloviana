import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { WorkflowRunsModule } from "@/modules/workflow-runs/workflow-runs.module";
import { Module } from "@nestjs/common";
import { MonitoringScheduler } from "./background/schedulers/monitoring.scheduler";
import { MonitoringWorkflowModule } from "./background/workflows/monitoring/monitoring-workflow.module";
import { MonitoringController } from "./monitoring.controller";
import { MonitoringEligibilityService } from "./services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "./services/monitoring-enqueue.service";

@Module({
  imports: [WorkflowRunsModule, MonitoringWorkflowModule],
  controllers: [MonitoringController],
  providers: [
    BusinessAccessGuard,
    MonitoringEligibilityService,
    MonitoringEnqueueService,
    MonitoringScheduler,
  ],
})
export class MonitoringModule {}
