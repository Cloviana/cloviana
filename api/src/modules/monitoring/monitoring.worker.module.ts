import { MonitoringWorkflowModule } from "@/workflows/monitoring/monitoring.module";
import { Module } from "@nestjs/common";
import { MonitoringConsumer } from "./consumers/monitoring.consumer";
import { MonitoringScheduler } from "./schedulers/monitoring.scheduler";
import { MonitoringEligibilityService } from "./services/monitoring-eligibility.service";

@Module({
  imports: [MonitoringWorkflowModule],
  controllers: [MonitoringConsumer],
  providers: [MonitoringEligibilityService, MonitoringScheduler],
})
export class MonitoringWorkerModule {}
