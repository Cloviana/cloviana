import type { RunMonitoringPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import { RUN_MONITORING_EVENT } from "@/infrastructure/messaging/rabbitmq.contracts";
import { MonitoringWorkflow } from "@/workflows/monitoring/monitoring.workflow";
import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";

@Controller()
export class MonitoringConsumer {
  private readonly logger = new Logger(MonitoringConsumer.name);

  constructor(private readonly monitoringWorkflow: MonitoringWorkflow) {}

  @EventPattern(RUN_MONITORING_EVENT)
  async handleRunMonitoring(@Payload() payload: RunMonitoringPayload) {
    const businessId = payload?.businessId?.trim();
    const promptIds = payload?.promptIds?.filter((promptId) =>
      promptId?.trim(),
    );

    if (!businessId || !promptIds?.length) {
      this.logger.error(
        `Received ${RUN_MONITORING_EVENT} with invalid businessId=${payload?.businessId} promptIds=${JSON.stringify(payload?.promptIds)}`,
      );
      return;
    }

    this.logger.log(
      `Received ${RUN_MONITORING_EVENT} event for businessId=${businessId} promptCount=${promptIds.length}`,
    );

    try {
      await this.monitoringWorkflow.run(businessId, promptIds);
      this.logger.log(
        `Monitoring workflow completed for businessId=${businessId} promptCount=${promptIds.length}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Monitoring workflow failed for businessId=${businessId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
