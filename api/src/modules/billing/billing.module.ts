import { Module } from "@nestjs/common";
import { BillingWebhookController } from "./controllers/billing-webhook.controller";
import { BillingController } from "./controllers/billing.controller";
import { BillingService } from "./services/billing.service";
import { StripeService } from "./services/stripe.service";

@Module({
  controllers: [BillingController, BillingWebhookController],
  providers: [StripeService, BillingService],
  exports: [StripeService, BillingService],
})
export class BillingModule {}
