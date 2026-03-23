import { DataForSeoModule } from "@/integrations/dataforseo/dataforseo.module";
import { ExaModule } from "@/integrations/exa/exa.module";
import { Module } from "@nestjs/common";
import { AuditWorkflow } from "./audit.workflow";

@Module({
  imports: [ExaModule, DataForSeoModule],
  providers: [AuditWorkflow],
  exports: [AuditWorkflow],
})
export class AuditModule {}