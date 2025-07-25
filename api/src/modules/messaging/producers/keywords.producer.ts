import {
  KEYWORDS_CLIENT,
  KEYWORDS_SEEDED_EVENT,
} from "@/constants/rabbitmq.constants";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class KeywordsProducer {
  constructor(
    @Inject(KEYWORDS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async seedKeywords(payload: {
    storeId: string;
    email: string;
  }): Promise<void> {
    await firstValueFrom(this.client.emit(KEYWORDS_SEEDED_EVENT, payload));
  }
}
