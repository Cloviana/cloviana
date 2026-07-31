import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { MonitoringRunPayload } from "./monitoring.queue";
import { MONITORING_QUEUE, MONITORING_RUN_EVENT } from "./monitoring.queue";

@Injectable()
export class MonitoringProducer {
  constructor(
    @Inject(MONITORING_QUEUE.clientToken)
    private readonly rabbitMqClient: ClientProxy,
  ) {}

  async enqueueMonitoringRun(payload: MonitoringRunPayload): Promise<void> {
    await firstValueFrom(
      this.rabbitMqClient.emit(MONITORING_RUN_EVENT, payload),
    );
  }
}
