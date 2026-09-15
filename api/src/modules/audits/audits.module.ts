import { Module } from "@nestjs/common";
import { AuditsController } from "./audits.controller";
import { AuditsService } from "./audits.service";
import { AuditWorkflowModule } from "./background/workflows/audit/audit.module";

@Module({
  imports: [AuditWorkflowModule],
  controllers: [AuditsController],
  providers: [AuditsService],
})
export class AuditsModule {}
