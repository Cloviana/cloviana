import type { RunAuditPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import {
  AUDITS_QUEUE,
  RUN_AUDIT_EVENT,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuditsProducer {
  constructor(
    @Inject(AUDITS_QUEUE.clientToken)
    private readonly client: ClientProxy,
  ) {}

  async runAudit(payload: RunAuditPayload): Promise<void> {
    await firstValueFrom(this.client.emit(RUN_AUDIT_EVENT, payload));
  }
}
