import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { MonitoringAnalysisService } from "./monitoring-analysis.service";
import { MonitoringEngineService } from "./monitoring-engine.service";
import { MonitoringPersistenceService } from "./monitoring-persistence.service";
import { MonitoringWorkflow } from "./monitoring.workflow";

@Module({
  imports: [JobsModule, DataForSeoModule],
  providers: [
    MonitoringWorkflow,
    MonitoringEngineService,
    MonitoringAnalysisService,
    MonitoringPersistenceService,
  ],
  exports: [MonitoringWorkflow],
})
export class MonitoringWorkflowModule {}
