import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Controller, Get, Param, Patch } from "@nestjs/common";
import { BusinessesService } from "./businesses.service";

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get("entry")
  getEntryDestination(@CurrentUser() user: AuthUser) {
    return this.businessesService.getEntryDestination(user);
  }

  @Get()
  getBusinesses(@CurrentUser() user: AuthUser) {
    return this.businessesService.listBusinesses(user);
  }

  @Get(":id")
  getBusiness(@CurrentUser() user: AuthUser, @Param("id") businessId: string) {
    return this.businessesService.getBusiness(user, businessId);
  }

  @Patch(":businessId/last-accessed")
  setLastAccessedBusiness(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
  ) {
    return this.businessesService.setLastAccessedBusiness(user, businessId);
  }
}
