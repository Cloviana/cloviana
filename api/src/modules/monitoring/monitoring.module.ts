import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { MonitoringController } from "./monitoring.controller";
import { MonitoringEligibilityService } from "./services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "./services/monitoring-enqueue.service";
import { MonitoringOverviewService } from "./services/monitoring-overview.service";

import { MonitoringDomainsService } from "./services/monitoring-domains.service";
import { MonitoringPromptsService } from "./services/monitoring-prompts.service";

@Module({
  imports: [JobsModule],
  controllers: [MonitoringController],
  providers: [
    BusinessAccessGuard,
    MonitoringEligibilityService,
    MonitoringEnqueueService,
    MonitoringOverviewService,
    MonitoringDomainsService,
    MonitoringPromptsService,
  ],
  exports: [MonitoringEligibilityService, MonitoringEnqueueService],
})
export class MonitoringModule {}
