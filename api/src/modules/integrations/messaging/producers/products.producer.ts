import {
  PRODUCTS_CLIENT,
  SYNC_PRODUCTS_EVENT,
} from "@/constants/rabbitmq.constants";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ProductsProducer {
  constructor(
    @Inject(PRODUCTS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async sync(payload: {
    storeId: string;
  }): Promise<void> {
    await firstValueFrom(this.client.emit(SYNC_PRODUCTS_EVENT, payload));
  }
}
