import type { RunMonitoringPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import {
  MONITORING_QUEUE,
  RUN_MONITORING_EVENT,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class MonitoringProducer {
  constructor(
    @Inject(MONITORING_QUEUE.clientToken)
    private readonly client: ClientProxy,
  ) {}

  async runMonitoring(payload: RunMonitoringPayload): Promise<void> {
    await firstValueFrom(this.client.emit(RUN_MONITORING_EVENT, payload));
  }
}
