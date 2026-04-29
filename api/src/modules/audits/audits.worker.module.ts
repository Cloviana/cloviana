import { AuditWorkflowModule } from "@/workflows/audits/audit.module";
import { Module } from "@nestjs/common";
import { AuditsConsumer } from "./consumers/audits.consumer";

@Module({
  imports: [AuditWorkflowModule],
  controllers: [AuditsConsumer],
})
export class AuditsWorkerModule {}
