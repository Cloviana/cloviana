import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { GetMemberUseCase } from "@/modules/vendors/application/get-member/get-member.use-case";
import type { Member } from "@/modules/vendors/domain/member";
import type { MarketplaceRequest } from "@/platform/auth/marketplace/marketplace-principal";
import { MarketplaceSessionService } from "@/platform/auth/marketplace/marketplace-session.service";

export type VendorRequest = MarketplaceRequest & { member?: Member };

/** Vendor routes: the signed-in user must already be an active member (via an accepted invite). */
@Injectable()
export class VendorAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: MarketplaceSessionService,
    private readonly getMember: GetMemberUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<VendorRequest>();
    const { tenant, marketplaceUser } =
      await this.sessions.authenticate(request);

    const member = await this.getMember.execute({
      marketplaceId: tenant.marketplaceId,
      marketplaceUserId: marketplaceUser.id,
    });
    if (!member?.isActive) {
      throw new ForbiddenException("Not a vendor member of this marketplace");
    }

    request.member = member;
    request.principal = {
      kind: "member",
      marketplaceId: tenant.marketplaceId,
      marketplaceUserId: marketplaceUser.id,
      memberId: member.id,
    };
    return true;
  }
}
