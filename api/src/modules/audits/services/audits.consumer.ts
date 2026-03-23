import { RUN_AUDIT_EVENT } from "@/constants/rabbitmq.constants";
import { AuditWorkflow } from "@/workflows/audit/audit.workflow";
import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";

interface RunAuditEvent {
  auditId: string;
}

@Controller()
export class AuditsConsumer {
  private readonly logger = new Logger(AuditsConsumer.name);

  constructor(private readonly auditWorkflow: AuditWorkflow) {}

  @EventPattern(RUN_AUDIT_EVENT)
  async handleRunAudit(@Payload() { auditId }: RunAuditEvent) {
    this.logger.log(
      `Received ${RUN_AUDIT_EVENT} event for auditId=${auditId}`,
    );

    try {
      await this.auditWorkflow.run(auditId);
      this.logger.log(`Audit workflow completed for auditId=${auditId}`);
    } catch (err: any) {
      this.logger.error(
        `Audit workflow failed for auditId=${auditId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
