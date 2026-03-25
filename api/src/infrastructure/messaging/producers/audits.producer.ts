import {
  AUDITS_CLIENT,
  RUN_AUDIT_EVENT,
} from "@/constants/rabbitmq.constants";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AuditsProducer {
  constructor(
    @Inject(AUDITS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async run(payload: { auditId: string }): Promise<void> {
    await firstValueFrom(this.client.emit(RUN_AUDIT_EVENT, payload));
  }
}
