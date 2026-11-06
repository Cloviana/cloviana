import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";

import { AcceptInviteUseCase } from "@/modules/vendors/application/accept-invite/accept-invite.use-case";
import type { Member } from "@/modules/vendors/domain/member";
import {
  CurrentMarketplaceSession,
  MarketplaceSessionRoute,
} from "@/platform/auth/marketplace/marketplace-auth.decorators";
import type { MarketplacePrincipalSession } from "@/platform/auth/marketplace/marketplace-principal";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { CurrentMember, VendorRoute } from "./vendor-route.decorator";

@Controller("vendor")
export class VendorController {
  constructor(private readonly acceptInvite: AcceptInviteUseCase) {}

  @Get("me")
  @VendorRoute()
  me(@CurrentMember() member: Member) {
    return {
      memberId: member.id,
      marketplaceId: member.marketplaceId,
      email: member.email,
      sellers: member.sellers,
    };
  }

  // Needs a session but not yet a membership: this is how a user becomes a member.
  @Post("invites/accept")
  @HttpCode(HttpStatus.OK)
  @MarketplaceSessionRoute()
  async accept(
    @CurrentMarketplaceSession() session: MarketplacePrincipalSession,
    @Body() body: AcceptInviteDto,
  ) {
    const member = await this.acceptInvite.execute({
      marketplaceId: session.tenant.marketplaceId,
      token: body.token,
      marketplaceUser: session.marketplaceUser,
    });
    return { memberId: member.id, sellers: member.sellers };
  }
}
