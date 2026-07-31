import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { BusinessResearchModule } from "@/modules/businesses/research/business-research.module";
import { Module } from "@nestjs/common";
import { AuditAnalysis } from "./audit.analysis";
import { AuditEngines } from "./audit.engines";
import { AuditPersistence } from "./audit.persistence";
import { AuditWorkflow } from "./audit.workflow";

@Module({
  imports: [DataForSeoModule, BusinessResearchModule],
  providers: [AuditWorkflow, AuditEngines, AuditAnalysis, AuditPersistence],
  exports: [AuditWorkflow],
})
export class AuditWorkflowModule {}
