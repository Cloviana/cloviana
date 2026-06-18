import type { RunMonitoringPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import { RUN_MONITORING_EVENT } from "@/infrastructure/messaging/rabbitmq.contracts";
import { MonitoringWorkflow } from "@/workflows/monitoring/monitoring.workflow";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload } from "@nestjs/microservices";
import { RmqContext } from "@nestjs/microservices";

@Controller()
export class MonitoringConsumer {
  private readonly logger = new Logger(MonitoringConsumer.name);

  constructor(private readonly monitoringWorkflow: MonitoringWorkflow) {}

  @EventPattern(RUN_MONITORING_EVENT)
  async handleRunMonitoring(
    @Payload() payload: RunMonitoringPayload,
    @Ctx() context?: RmqContext,
  ) {
    const jobId = payload?.jobId?.trim();
    const businessId = payload?.businessId?.trim();
    const runDate = payload?.runDateIso
      ? new Date(payload.runDateIso)
      : undefined;
    const promptIds = payload?.promptIds?.filter((promptId) =>
      promptId?.trim(),
    );

    if (!jobId || !businessId || !promptIds?.length) {
      this.logger.error(
        `Received ${RUN_MONITORING_EVENT} with invalid jobId=${payload?.jobId} businessId=${payload?.businessId} promptIds=${JSON.stringify(payload?.promptIds)}`,
      );
      this.ack(context);
      return;
    }

    this.logger.log(
      `Received ${RUN_MONITORING_EVENT} event for businessId=${businessId} promptCount=${promptIds.length}`,
    );

    try {
      const job = await this.monitoringWorkflow.run(
        jobId,
        businessId,
        promptIds,
        runDate,
      );
      this.logger.log(
        `Monitoring workflow handled for businessId=${businessId} jobId=${jobId} status=${job.status} promptCount=${promptIds.length}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Monitoring workflow failed for businessId=${businessId}: ${err.message}`,
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
