import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Body, Controller, Param, Post } from "@nestjs/common";
import { CreateCheckoutSessionDto } from "../dto/create-checkout-session.dto";
import { BillingService } from "../services/billing.service";

@Controller("businesses/:businessId/billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("checkout")
  createCheckoutSession(
    @Param("businessId") businessId: string,
    @Body() body: CreateCheckoutSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.billing.createCheckoutSession(user, businessId, body.priceId);
  }

  @Post("portal")
  createPortalSession(
    @Param("businessId") businessId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.billing.createPortalSession(user, businessId);
  }
}
