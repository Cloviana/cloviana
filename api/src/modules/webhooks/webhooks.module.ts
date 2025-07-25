import { Module } from "@nestjs/common";

import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { StripeModule } from "@/clients";

@Module({
  imports: [StripeModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
