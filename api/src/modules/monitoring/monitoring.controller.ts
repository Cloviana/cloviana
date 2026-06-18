import { PrismaService } from "@/clients/prisma/prisma.service";
import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AiEngine, DomainType, PromptStatus } from "@prisma/client";
import { MonitoringDomainsService } from "./services/monitoring-domains.service";
import { MonitoringEnqueueService } from "./services/monitoring-enqueue.service";
import { MonitoringOverviewService } from "./services/monitoring-overview.service";
import { MonitoringPromptsService } from "./services/monitoring-prompts.service";

@Controller("businesses/:businessId/monitoring")
@UseGuards(BusinessAccessGuard)
export class MonitoringController {
  constructor(
    private readonly overview: MonitoringOverviewService,
    private readonly domains: MonitoringDomainsService,
    private readonly prompts: MonitoringPromptsService,
    private readonly enqueue: MonitoringEnqueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("overview")
  getOverview(@Param("businessId") businessId: string) {
    return this.overview.getOverview(businessId);
  }

  @Get("gap")
  getGapAnalysis(
    @Param("businessId") businessId: string,
    @Query("kind") kind?: "domains" | "hosts" | "urls",
    @Query("engine") engine?: AiEngine | "ALL",
    @Query("range") range?: "D" | "W" | "M",
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("type") type?: DomainType | "ALL",
    @Query("urlType") urlType?: string | "ALL",
    @Query("minCompetitors") minCompetitors?: string,
  ) {
    if (kind) {
      return this.domains.getSourceGaps(businessId, kind, {
        engine,
        range,
        page: Number(page),
        limit: Number(limit),
        search,
        type,
        urlType,
        minCompetitors: Number(minCompetitors),
      });
    }

    return this.overview.getGapAnalysis(businessId, range);
  }

  @Get("domains")
  getDomainsOverview(
    @Param("businessId") businessId: string,
    @Query("engine") engine?: AiEngine | "ALL",
    @Query("range") range?: "D" | "W" | "M",
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("type") type?: DomainType | "ALL",
    @Query("urlType") urlType?: string | "ALL",
    @Query("owner") owner?: "OWN" | "COMPETITOR" | "THIRD_PARTY" | "ALL",
  ) {
    return this.domains.getDomainsOverview(businessId, {
      engine,
      range,
      page: Number(page),
      limit: Number(limit),
      search,
      type,
      urlType,
      owner,
    });
  }

  @Get("hosts")
  getHostsOverview(
    @Param("businessId") businessId: string,
    @Query("engine") engine?: AiEngine | "ALL",
    @Query("range") range?: "D" | "W" | "M",
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("type") type?: DomainType | "ALL",
    @Query("urlType") urlType?: string | "ALL",
    @Query("owner") owner?: "OWN" | "COMPETITOR" | "THIRD_PARTY" | "ALL",
  ) {
    return this.domains.getHostsOverview(businessId, {
      engine,
      range,
      page: Number(page),
      limit: Number(limit),
      search,
      type,
      urlType,
      owner,
    });
  }

  @Get("urls")
  getUrlsOverview(
    @Param("businessId") businessId: string,
    @Query("engine") engine?: AiEngine | "ALL",
    @Query("range") range?: "D" | "W" | "M",
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("type") type?: DomainType | "ALL",
    @Query("urlType") urlType?: string | "ALL",
    @Query("owner") owner?: "OWN" | "COMPETITOR" | "THIRD_PARTY" | "ALL",
  ) {
    return this.domains.getUrlsOverview(businessId, {
      engine,
      range,
      page: Number(page),
      limit: Number(limit),
      search,
      type,
      urlType,
      owner,
    });
  }

  @Get("prompts")
  getPromptsOverview(@Param("businessId") businessId: string) {
    return this.prompts.getPromptsOverview(businessId);
  }

  @Patch("prompts/status")
  async updatePromptsStatus(
    @Param("businessId") businessId: string,
    @Body() dto: { promptIds: string[]; status: PromptStatus },
  ) {
    await this.prisma.prompt.updateMany({
      where: {
        id: { in: dto.promptIds },
        businessId,
      },
      data: {
        status: dto.status,
      },
    });
    return { success: true };
  }

  @Get("chats")
  getRecentChats(
    @Param("businessId") businessId: string,
    @Query("engine") engine?: AiEngine | "ALL",
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("topicId") topicId?: string,
  ) {
    return this.domains.getRecentChats(businessId, {
      engine,
      page: Number(page),
      limit: Number(limit),
      search,
      topicId,
    });
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

  @Get("robotstxt")
  async getRobotsTxt(@Param("businessId") businessId: string) {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { domain: true },
    });

    const domain = business.domain;
    const urls = [
      `https://${domain}/robots.txt`,
      `http://${domain}/robots.txt`,
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const text = await res.text();
          return { domain, content: text, source: url };
        }
      } catch {}
    }

    return {
      domain,
      content: null,
      source: null,
      error: "Could not fetch robots.txt",
    };
  }
}
