import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { WorkflowRunsModule } from "@/modules/workflow-runs/workflow-runs.module";
import { Module } from "@nestjs/common";
import { MonitoringWorkflow } from "./monitoring.workflow";

@Module({
  imports: [WorkflowRunsModule, DataForSeoModule],
  providers: [MonitoringWorkflow],
  exports: [MonitoringWorkflow],
})
export class MonitoringWorkflowModule {}
