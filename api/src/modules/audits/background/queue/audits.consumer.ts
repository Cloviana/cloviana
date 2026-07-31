import { acknowledgeRabbitMqMessage } from "@/infrastructure/rabbitmq/rabbitmq-settlement";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { AuditWorkflow } from "../workflows/audit/audit.workflow";
import type { RunAuditPayload } from "./audits.queue";
import { RUN_AUDIT_EVENT } from "./audits.queue";

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
    } catch (error: unknown) {
      this.logger.error(
        `Audit workflow failed for auditId=${auditId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
    acknowledgeRabbitMqMessage(context, this.logger);
  }
}
