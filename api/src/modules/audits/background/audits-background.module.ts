import { Module } from "@nestjs/common";
import { AuditsConsumer } from "./queue/audits.consumer";
import { AuditWorkflowModule } from "./workflows/audit/audit.module";

@Module({
  imports: [AuditWorkflowModule],
  controllers: [AuditsConsumer],
})
export class AuditsBackgroundModule {}
