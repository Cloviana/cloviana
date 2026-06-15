import { Module } from "@nestjs/common";

import { BusinessOwnerGuard } from "@/common/guards/business-owner.guard";
import { ExaModule } from "@/integrations";
import { MonitoringModule } from "@/modules/monitoring/monitoring.module";
import { BusinessesController } from "./businesses.controller";
import { BusinessMembersService } from "./services/business-members.service";
import { BusinessResearchService } from "./services/business-research.service";
import { BusinessSetupService } from "./services/business-setup.service";
import { BusinessesMaintenanceService } from "./services/businesses-maintenance.service";
import { BusinessesService } from "./services/businesses.service";

@Module({
  imports: [ExaModule, MonitoringModule],
  controllers: [BusinessesController],
  providers: [
    BusinessesService,
    BusinessesMaintenanceService,
    BusinessResearchService,
    BusinessSetupService,
    BusinessMembersService,
    BusinessOwnerGuard,
  ],
  exports: [BusinessResearchService],
})
export class BusinessesModule {}
