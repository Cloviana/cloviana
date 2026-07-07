import { Module } from "@nestjs/common";

import { BusinessOwnerGuard } from "@/common/guards/business-owner.guard";
import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import { ExaModule } from "@/integrations";
import { MonitoringModule } from "@/modules/monitoring/monitoring.module";
import { BusinessesController } from "./businesses.controller";
import { InternalBusinessesController } from "./internal-businesses.controller";
import { BusinessMembersService } from "./services/business-members.service";
import { BusinessResearchService } from "./services/business-research.service";
import { BusinessesService } from "./services/businesses.service";

@Module({
  imports: [ExaModule, MonitoringModule],
  controllers: [BusinessesController, InternalBusinessesController],
  providers: [
    BusinessesService,
    BusinessResearchService,
    BusinessMembersService,
    BusinessOwnerGuard,
    InternalTokenGuard,
  ],
  exports: [BusinessResearchService],
})
export class BusinessesModule {}
