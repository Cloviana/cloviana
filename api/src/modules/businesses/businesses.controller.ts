import { BusinessOwnerGuard } from "@/common/guards/business-owner.guard";
import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CreateBusinessInviteDto } from "./dto/create-business-invite.dto";
import { BusinessMembersService } from "./services/business-members.service";
import { BusinessesService } from "./services/businesses.service";

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly businessMembers: BusinessMembersService,
  ) {}

  @Get("entry")
  async getEntry(@CurrentUser() user: AuthUser) {
    return this.businesses.getEntry(user);
  }

  @Get()
  async getBusinesses(@CurrentUser() user: AuthUser) {
    return this.businesses.list(user);
  }

  @Get(":id")
  async getBusiness(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.businesses.getById(user, id);
  }

  @Patch(":businessId/last-accessed")
  async markLastAccessed(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
  ) {
    return this.businesses.markLastAccessed(user, businessId);
  }

  @Get(":businessId/members")
  @UseGuards(BusinessOwnerGuard)
  async listMembers(@Param("businessId") businessId: string) {
    return this.businessMembers.listMembers(businessId);
  }

  @Post(":businessId/invites")
  @UseGuards(BusinessOwnerGuard)
  async createInvite(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
    @Body() dto: CreateBusinessInviteDto,
  ) {
    return this.businessMembers.createInvite(user, businessId, dto);
  }
}
