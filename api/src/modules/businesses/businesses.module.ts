import { Module } from "@nestjs/common";

import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import { BusinessesController } from "./businesses.controller";
import { BusinessesService } from "./businesses.service";
import { InternalBusinessesController } from "./internal-businesses.controller";
import { BusinessMembersController } from "./members/business-members.controller";
import { BusinessMembersService } from "./members/business-members.service";
import { BusinessOwnerGuard } from "./members/business-owner.guard";

@Module({
  controllers: [
    BusinessesController,
    BusinessMembersController,
    InternalBusinessesController,
  ],
  providers: [
    BusinessesService,
    BusinessMembersService,
    BusinessOwnerGuard,
    InternalTokenGuard,
  ],
})
export class BusinessesModule {}
