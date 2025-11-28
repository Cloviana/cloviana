import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Body, Controller, Param, Post } from "@nestjs/common";
import { CreateCheckoutSessionDto } from "../dto/create-checkout-session.dto";
import { BillingService } from "../services/billing.service";

@Controller("stores/:storeId/billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("checkout")
  createCheckoutSession(
    @Param("storeId") storeId: string,
    @Body() body: CreateCheckoutSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.billing.createCheckoutSession(user, storeId, body.priceId);
  }

  @Post("portal")
  createPortalSession(
    @Param("storeId") storeId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.billing.createPortalSession(user, storeId);
  }
}
