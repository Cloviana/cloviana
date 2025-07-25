import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Controller, Post, UseGuards } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { StoreEntity } from "@/decorators/store.decorator";
import type { Store } from "@prisma/client";

@Controller("stores/:storeId/billing")
@UseGuards(StoreOwnerGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("trials")
  async startTrial(@StoreEntity() store: Store, @CurrentUser() user: AuthUser) {
    const { email } = user;

    return this.billing.createTrialCheckoutSession(email, store);
  }
}
