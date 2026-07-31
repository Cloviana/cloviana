import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { MonitoringEnqueueService } from "./services/monitoring-enqueue.service";

@Controller("businesses/:businessId/monitoring")
@UseGuards(BusinessAccessGuard)
export class MonitoringController {
  constructor(private readonly enqueueService: MonitoringEnqueueService) {}

  @Post("trigger")
  triggerMonitoringRun(@Param("businessId") businessId: string) {
    return this.enqueueService.enqueueActivePrompts(businessId);
  }
}
