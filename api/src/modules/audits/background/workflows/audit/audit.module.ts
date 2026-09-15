import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { BusinessResearchModule } from "@/modules/businesses/research/business-research.module";
import { Module } from "@nestjs/common";
import { AuditWorkflow } from "./audit.workflow";

@Module({
  imports: [DataForSeoModule, BusinessResearchModule],
  providers: [AuditWorkflow],
  exports: [AuditWorkflow],
})
export class AuditWorkflowModule {}
