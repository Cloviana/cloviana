import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { JobsModule } from "@/modules";
import { Module } from "@nestjs/common";
import { MonitoringWorkflow } from "./monitoring.workflow";
import { MonitoringRunPersistenceService } from "./persistence/monitoring-run-persistence.service";

@Module({
  imports: [JobsModule, DataForSeoModule],
  providers: [MonitoringWorkflow, MonitoringRunPersistenceService],
  exports: [MonitoringWorkflow],
})
export class MonitoringWorkflowModule {}
