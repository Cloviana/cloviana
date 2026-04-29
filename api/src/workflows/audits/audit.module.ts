import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { BusinessesModule } from "@/modules";
import { Module } from "@nestjs/common";
import { AuditWorkflow } from "./audit.workflow";

@Module({
  imports: [DataForSeoModule, BusinessesModule],
  providers: [AuditWorkflow],
  exports: [AuditWorkflow],
})
export class AuditWorkflowModule {}
