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

import { CompleteBusinessSetupDto } from "./dto/complete-business-setup.dto";
import { CreateBusinessInviteDto } from "./dto/create-business-invite.dto";
import { StartBusinessSetupDto } from "./dto/start-business-setup.dto";
import { UpdateBusinessSetupCompetitorsDto } from "./dto/update-business-setup-competitors.dto";
import { UpdateBusinessSetupProfileDto } from "./dto/update-business-setup-profile.dto";
import { UpdateBusinessSetupTopicsDto } from "./dto/update-business-setup-topics.dto";
import { BusinessMembersService } from "./services/business-members.service";
import { BusinessSetupService } from "./services/business-setup.service";
import { BusinessesService } from "./services/businesses.service";

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly businessSetup: BusinessSetupService,
    private readonly businessMembers: BusinessMembersService,
  ) {}

  @Get("entry")
  async getEntry(@CurrentUser() user: AuthUser) {
    return this.businessSetup.getEntry(user);
  }

  @Get()
  async getBusinesses(@CurrentUser() user: AuthUser) {
    return this.businesses.list(user);
  }

  @Post("setup/start")
  async startSetup(
    @Body() dto: StartBusinessSetupDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.businessSetup.startSetup(user, dto);
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

  @Get(":businessId/setup")
  @UseGuards(BusinessOwnerGuard)
  async getSetup(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
  ) {
    return this.businessSetup.getSetup(user, businessId);
  }

  @Get(":businessId/setup/competitor-suggestions")
  @UseGuards(BusinessOwnerGuard)
  async getCompetitorSuggestions(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
  ) {
    return this.businessSetup.getCompetitorSuggestions(user, businessId);
  }

  @Patch(":businessId/setup/profile")
  @UseGuards(BusinessOwnerGuard)
  async updateSetupProfile(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
    @Body() dto: UpdateBusinessSetupProfileDto,
  ) {
    return this.businessSetup.updateSetupProfile(user, businessId, dto);
  }

  @Post(":businessId/setup/prompt-research")
  @UseGuards(BusinessOwnerGuard)
  async retryPromptResearch(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
  ) {
    return this.businessSetup.retryPromptResearch(user, businessId);
  }

  @Patch(":businessId/setup/topics")
  @UseGuards(BusinessOwnerGuard)
  async updateSetupTopics(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
    @Body() dto: UpdateBusinessSetupTopicsDto,
  ) {
    return this.businessSetup.updateSetupTopics(user, businessId, dto);
  }

  @Patch(":businessId/setup/competitors")
  @UseGuards(BusinessOwnerGuard)
  async updateSetupCompetitors(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
    @Body() dto: UpdateBusinessSetupCompetitorsDto,
  ) {
    return this.businessSetup.updateSetupCompetitors(user, businessId, dto);
  }

  @Post(":businessId/setup/complete")
  @UseGuards(BusinessOwnerGuard)
  async completeSetup(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
    @Body() dto: CompleteBusinessSetupDto,
  ) {
    return this.businessSetup.completeSetup(user, businessId, dto);
  }
}
