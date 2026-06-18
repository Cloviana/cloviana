import type { RunAuditPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import { RUN_AUDIT_EVENT } from "@/infrastructure/messaging/rabbitmq.contracts";
import { AuditWorkflow } from "@/workflows/audits/audit.workflow";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";

@Controller()
export class AuditsConsumer {
  private readonly logger = new Logger(AuditsConsumer.name);

  constructor(private readonly auditWorkflow: AuditWorkflow) {}

  @EventPattern(RUN_AUDIT_EVENT)
  async handleRunAudit(
    @Payload() { auditId }: RunAuditPayload,
    @Ctx() context?: RmqContext,
  ) {
    this.logger.log(`Received ${RUN_AUDIT_EVENT} event for auditId=${auditId}`);

    try {
      await this.auditWorkflow.run(auditId);
      this.logger.log(`Audit workflow completed for auditId=${auditId}`);
    } catch (err: any) {
      this.logger.error(
        `Audit workflow failed for auditId=${auditId}: ${err.message}`,
        err.stack,
      );
    }
    this.ack(context);
  }

  private ack(context?: RmqContext) {
    if (!context) return;

    try {
      const channel = context.getChannelRef();
      const message = context.getMessage();
      channel.ack(message);
    } catch (err: any) {
      this.logger.warn(
        `Failed to ack message — channel already closed: ${err.message}`,
      );
    }
  }
}
