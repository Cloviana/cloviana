import type { RunBlogGenerationPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import {
  BLOG_QUEUE,
  RUN_BLOG_GENERATION_EVENT,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BlogsProducer {
  constructor(
    @Inject(BLOG_QUEUE.clientToken)
    private readonly client: ClientProxy,
  ) {}

  async runBlogGeneration(payload: RunBlogGenerationPayload): Promise<void> {
    await firstValueFrom(this.client.emit(RUN_BLOG_GENERATION_EVENT, payload));
  }
}
