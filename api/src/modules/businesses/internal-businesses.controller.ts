import { Public } from "@/common/decorators/public.decorator";
import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { BusinessesService } from "./businesses.service";

@Controller("internal/businesses")
@UseGuards(InternalTokenGuard)
export class InternalBusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Public()
  @Get(":id/profile")
  getBusinessProfile(@Param("id") businessId: string) {
    return this.businessesService.getBusinessProfile(businessId);
  }
}
