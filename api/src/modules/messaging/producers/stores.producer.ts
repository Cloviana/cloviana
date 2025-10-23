import {
  INIT_STORES_EVENT,
  STORES_CLIENT,
} from "@/constants/rabbitmq.constants";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class StoresProducer {
  constructor(
    @Inject(STORES_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async init(payload: {
    storeId: string;
  }): Promise<void> {
    await firstValueFrom(this.client.emit(INIT_STORES_EVENT, payload));
  }
}
