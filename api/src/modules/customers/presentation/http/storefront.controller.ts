import { Controller, Get, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { GetStorefrontSiteUseCase } from "@/modules/customers/application/get-storefront-site/get-storefront-site.use-case";
import { Public } from "@/platform/auth/decorators/public.decorator";

import {
  CurrentMarketplaceSession,
  CurrentPrincipal,
} from "@/platform/auth/marketplace/marketplace-auth.decorators";
import type {
  MarketplacePrincipal,
  MarketplacePrincipalSession,
} from "@/platform/auth/marketplace/marketplace-principal";
import { requestHost } from "@/platform/tenancy/request-host";
import { StorefrontRoute } from "./storefront-route.decorator";

@Controller("storefront")
export class StorefrontController {
  constructor(private readonly getSite: GetStorefrontSiteUseCase) {}

  // No session: a storefront asks this before anyone has signed in.
  @Get("site")
  @Public()
  site(@Req() request: FastifyRequest) {
    return this.getSite.execute(requestHost(request.headers));
  }

  @Get("me")
  @StorefrontRoute()
  me(
    @CurrentPrincipal() principal: MarketplacePrincipal,
    @CurrentMarketplaceSession() session: MarketplacePrincipalSession,
  ) {
    return {
      kind: principal.kind,
      marketplaceId: principal.marketplaceId,
      customerId: principal.kind === "customer" ? principal.customerId : null,
      email: session.marketplaceUser.email,
      name: session.marketplaceUser.name,
    };
  }
}
