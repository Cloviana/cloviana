import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";

import { EnsureCustomerUseCase } from "@/modules/customers/application/ensure-customer/ensure-customer.use-case";
import type { MarketplaceRequest } from "@/platform/auth/marketplace/marketplace-principal";
import { MarketplaceSessionService } from "@/platform/auth/marketplace/marketplace-session.service";

/** Shopper routes: any signed-in user becomes a customer of this marketplace on first visit. */
@Injectable()
export class StorefrontAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: MarketplaceSessionService,
    private readonly ensureCustomer: EnsureCustomerUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MarketplaceRequest>();
    const { tenant, marketplaceUser } =
      await this.sessions.authenticate(request);

    const customer = await this.ensureCustomer.execute({
      marketplaceId: tenant.marketplaceId,
      marketplaceUser,
    });

    request.principal = {
      kind: "customer",
      marketplaceId: tenant.marketplaceId,
      marketplaceUserId: marketplaceUser.id,
      customerId: customer.id,
    };
    return true;
  }
}
