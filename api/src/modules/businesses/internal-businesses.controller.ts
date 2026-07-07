import { Public } from "@/common/decorators/public.decorator";
import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { BusinessesService } from "./services/businesses.service";

@Controller("internal/businesses")
@UseGuards(InternalTokenGuard)
export class InternalBusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Public()
  @Get(":id/profile")
  getProfile(@Param("id") id: string) {
    return this.businesses.getProfile(id);
  }
}
