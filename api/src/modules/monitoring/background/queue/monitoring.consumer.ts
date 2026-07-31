import { acknowledgeRabbitMqMessage } from "@/infrastructure/rabbitmq/rabbitmq-settlement";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { MonitoringWorkflow } from "../workflows/monitoring/monitoring.workflow";
import type { MonitoringRunPayload } from "./monitoring.queue";
import { MONITORING_RUN_EVENT } from "./monitoring.queue";

@Controller()
export class MonitoringConsumer {
  private readonly logger = new Logger(MonitoringConsumer.name);

  constructor(private readonly monitoringWorkflow: MonitoringWorkflow) {}

  @EventPattern(MONITORING_RUN_EVENT)
  async handleMonitoringRun(
    @Payload() payload: MonitoringRunPayload,
    @Ctx() context?: RmqContext,
  ): Promise<void> {
    const jobId = payload?.jobId?.trim();
    const businessId = payload?.businessId?.trim();
    const runDate = payload?.runDateIso
      ? new Date(payload.runDateIso)
      : undefined;
    const promptIds = payload?.promptIds
      ?.map((promptId) => (typeof promptId === "string" ? promptId.trim() : ""))
      .filter((promptId) => promptId.length > 0);
    const runDateIsInvalid =
      runDate !== undefined && Number.isNaN(runDate.getTime());

    if (!jobId || !businessId || !promptIds?.length || runDateIsInvalid) {
      this.logger.error(
        `Received ${MONITORING_RUN_EVENT} with invalid jobId=${payload?.jobId} businessId=${payload?.businessId} promptIds=${JSON.stringify(payload?.promptIds)} runDateIso=${payload?.runDateIso}`,
      );
      acknowledgeRabbitMqMessage(context, this.logger);
      return;
    }

    this.logger.log(
      `Received ${MONITORING_RUN_EVENT} event for businessId=${businessId} promptCount=${promptIds.length}`,
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
    } catch (error) {
      this.logger.error(
        `Monitoring workflow failed for businessId=${businessId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    acknowledgeRabbitMqMessage(context, this.logger);
  }
}
