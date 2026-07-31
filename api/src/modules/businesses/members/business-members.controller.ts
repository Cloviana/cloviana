import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { BusinessMembersService } from "./business-members.service";
import { BusinessOwnerGuard } from "./business-owner.guard";
import { CreateBusinessInviteDto } from "./create-business-invite.dto";

@Controller("businesses/:businessId")
@UseGuards(BusinessOwnerGuard)
export class BusinessMembersController {
  constructor(
    private readonly businessMembersService: BusinessMembersService,
  ) {}

  @Get("members")
  listMembers(@Param("businessId") businessId: string) {
    return this.businessMembersService.listMembers(businessId);
  }

  @Post("invites")
  inviteMember(
    @CurrentUser() inviter: AuthUser,
    @Param("businessId") businessId: string,
    @Body() invite: CreateBusinessInviteDto,
  ) {
    return this.businessMembersService.inviteMember(
      inviter,
      businessId,
      invite,
    );
  }
}
