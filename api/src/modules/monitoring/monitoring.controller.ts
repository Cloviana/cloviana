import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PromptStatus } from "@prisma/client";
import { MonitoringDomainsService } from "./services/monitoring-domains.service";
import { MonitoringEnqueueService } from "./services/monitoring-enqueue.service";
import { MonitoringOverviewService } from "./services/monitoring-overview.service";

@Controller("businesses/:businessId/monitoring")
@UseGuards(BusinessAccessGuard)
export class MonitoringController {
  constructor(
    private readonly overview: MonitoringOverviewService,
    private readonly domains: MonitoringDomainsService,
    private readonly enqueue: MonitoringEnqueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("overview")
  getOverview(@Param("businessId") businessId: string) {
    return this.overview.getOverview(businessId);
  }

  @Get("gap")
  getGapAnalysis(@Param("businessId") businessId: string) {
    return this.overview.getGapAnalysis(businessId);
  }

  @Get("domains")
  getDomainsOverview(@Param("businessId") businessId: string) {
    return this.domains.getDomainsOverview(businessId);
  }

  @Get("urls")
  getUrlsOverview(@Param("businessId") businessId: string) {
    return this.domains.getUrlsOverview(businessId);
  }

  @Get("chats")
  getRecentChats(@Param("businessId") businessId: string) {
    return this.domains.getRecentChats(businessId);
  }

  @Post("trigger")
  async triggerRun(@Param("businessId") businessId: string) {
    const prompts = await this.prisma.prompt.findMany({
      where: { businessId, status: PromptStatus.ACTIVE },
      select: { id: true },
    });

    const promptIds = prompts.map((p) => p.id);
    return this.enqueue.enqueue(businessId, promptIds);
  }
}
