import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";

import { requestHost } from "@/platform/tenancy/request-host";
import { TenantResolverService } from "@/platform/tenancy/tenant-resolver.service";
import type { MarketplaceAuth } from "./marketplace-auth.factory";
import { MARKETPLACE_AUTH } from "./marketplace-auth.token";
import type {
  MarketplacePrincipalSession,
  MarketplaceRequest,
} from "./marketplace-principal";

@Injectable()
export class MarketplaceSessionService {
  constructor(
    @Inject(MARKETPLACE_AUTH) private readonly auth: MarketplaceAuth,
    private readonly resolver: TenantResolverService,
  ) {}

  /** Resolves the marketplace from the host and the user from the session cookie. */
  async authenticate(
    request: MarketplaceRequest,
  ): Promise<MarketplacePrincipalSession> {
    if (request.marketplaceSession) {
      return request.marketplaceSession;
    }

    const tenant = await this.resolver.resolveHost(
      requestHost(request.headers),
    );
    if (!tenant) {
      throw new NotFoundException("Marketplace not found");
    }
    if (tenant.status === "SUSPENDED") {
      throw new ForbiddenException("This marketplace is suspended");
    }

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      throw new UnauthorizedException();
    }

    request.marketplaceSession = {
      tenant,
      marketplaceUser: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.emailVerified,
      },
    };
    return request.marketplaceSession;
  }
}
