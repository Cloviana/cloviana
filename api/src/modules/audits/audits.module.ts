import { AuditModule as AuditWorkflowModule } from "@/workflows/audit/audit.module";
import { Module } from "@nestjs/common";
import { AuditsController } from "./audits.controller";
import { AuditsService } from "./audits.service";
import { AuditsConsumer } from "./services/audits.consumer";

@Module({
  imports: [AuditWorkflowModule],
  controllers: [AuditsController, AuditsConsumer],
  providers: [AuditsService],
})
export class AuditsModule {}
