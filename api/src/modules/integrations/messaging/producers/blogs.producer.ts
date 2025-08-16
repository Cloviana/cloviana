import {
  BLOGS_CLIENT,
  GENERATE_BLOG_EVENT,
} from "@/constants/rabbitmq.constants";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BlogsProducer {
  constructor(
    @Inject(BLOGS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async generateBlog(payload: {
    blogId: string;
    storeId: string;
  }): Promise<void> {
    await firstValueFrom(this.client.emit(GENERATE_BLOG_EVENT, payload));
  }
}
