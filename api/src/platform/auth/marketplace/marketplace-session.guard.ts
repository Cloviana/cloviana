import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";

import type { MarketplaceRequest } from "./marketplace-principal";
import { MarketplaceSessionService } from "./marketplace-session.service";

/** Requires a signed-in user on a known marketplace host; says nothing about their role there. */
@Injectable()
export class MarketplaceSessionGuard implements CanActivate {
  constructor(private readonly sessions: MarketplaceSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MarketplaceRequest>();
    await this.sessions.authenticate(request);
    return true;
  }
}
