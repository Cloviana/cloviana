import { MonitoringWorkflowModule } from "@/workflows/monitoring/monitoring.module";
import { Module } from "@nestjs/common";
import { MonitoringConsumer } from "./consumers/monitoring.consumer";
import { MonitoringModule } from "./monitoring.module";
import { MonitoringScheduler } from "./schedulers/monitoring.scheduler";

@Module({
  imports: [MonitoringModule, MonitoringWorkflowModule],
  controllers: [MonitoringConsumer],
  providers: [MonitoringScheduler],
})
export class MonitoringWorkerModule {}
