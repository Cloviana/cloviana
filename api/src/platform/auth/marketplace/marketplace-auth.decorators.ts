import {
  type ExecutionContext,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from "@nestjs/common";

import { Public } from "@/platform/auth/decorators/public.decorator";
import type {
  MarketplacePrincipal,
  MarketplacePrincipalSession,
  MarketplaceRequest,
} from "./marketplace-principal";
import { MarketplaceSessionGuard } from "./marketplace-session.guard";

/**
 * Marketplace-realm routes skip the global platform guard (platform users only) and use
 * their own guard instead.
 */
export const MarketplaceSessionRoute = () =>
  applyDecorators(Public(), UseGuards(MarketplaceSessionGuard));

export const CurrentMarketplaceSession = createParamDecorator<
  unknown,
  MarketplacePrincipalSession
>((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<MarketplaceRequest>();
  return request.marketplaceSession as MarketplacePrincipalSession;
});

export const CurrentPrincipal = createParamDecorator<
  unknown,
  MarketplacePrincipal
>((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<MarketplaceRequest>();
  return request.principal as MarketplacePrincipal;
});
