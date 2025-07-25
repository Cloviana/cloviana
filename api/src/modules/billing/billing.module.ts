import { Module } from "@nestjs/common";

import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { StripeModule } from "@/clients";

@Module({
  imports: [StripeModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
