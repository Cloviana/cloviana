import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { RunAuditPayload } from "./audits.queue";
import { AUDITS_QUEUE, RUN_AUDIT_EVENT } from "./audits.queue";

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
