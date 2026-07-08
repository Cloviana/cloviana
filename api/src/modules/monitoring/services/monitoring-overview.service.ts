import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { JobType, PromptStatus } from "@prisma/client";

@Injectable()
export class MonitoringOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(businessId: string) {
    const [business, latestRun, aggregateMetrics] = await Promise.all([
      this.prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        include: {
          competitors: { orderBy: { createdAt: "asc" } },
          prompts: {
            where: { status: PromptStatus.ACTIVE },
            include: { tags: true },
            orderBy: { createdAt: "asc" },
          },
          tags: {
            include: { _count: { select: { prompts: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      this.prisma.job.findFirst({
        where: { businessId, type: JobType.MONITORING },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          error: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
      this.prisma.businessMetric.findMany({
        where: { businessId, competitorId: null, engine: null },
        orderBy: { date: "desc" },
        take: 30,
      }),
    ]);

    const latestDate = aggregateMetrics[0]?.date ?? null;
    const engineMetrics = latestDate
      ? await this.prisma.businessMetric.findMany({
          where: {
            businessId,
            competitorId: null,
            engine: { not: null },
            date: latestDate,
          },
          orderBy: { engine: "asc" },
        })
      : [];
    const latest = aggregateMetrics[0] ?? null;

    return {
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        category: business.category,
        status: business.status,
      },
      latestRun,
      summary: latest
        ? {
            date: latest.date,
            mentionRate: latest.mentionRate,
            citationShare: latest.citationShare,
            sov: latest.sov,
          }
        : null,
      engines: engineMetrics.map((metric) => ({
        engine: metric.engine,
        mentionRate: metric.mentionRate,
        citationShare: metric.citationShare,
        sov: metric.sov,
      })),
      trend: aggregateMetrics
        .slice()
        .reverse()
        .map((metric) => ({
          date: metric.date,
          mentionRate: metric.mentionRate,
          citationShare: metric.citationShare,
          sov: metric.sov,
        })),
      prompts: {
        active: business.prompts.length,
        monitored: business.prompts.filter((prompt) => prompt.lastRunAt).length,
        list: business.prompts.map((p) => ({
          id: p.id,
          text: p.text,
          awarenessStage: p.awarenessStage,
          lastRunAt: p.lastRunAt,
          topics: p.tags.map((t) => t.text),
        })),
      },
      topics: business.tags.map((tag) => ({
        id: tag.id,
        name: tag.text,
        promptCount: tag._count.prompts,
      })),
      competitors: business.competitors.map(({ id, domain, name }) => ({
        id,
        domain,
        name,
      })),
    };
  }

  async getGapAnalysis(businessId: string) {
    // Bound the scan: the dashboard trend never needs unbounded history.
    const historyFloor = new Date();
    historyFloor.setUTCDate(historyFloor.getUTCDate() - 365);

    const [business, metrics] = await Promise.all([
      this.prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        include: { competitors: true },
      }),
      this.prisma.businessMetric.findMany({
        where: { businessId, engine: null, date: { gte: historyFloor } },
        orderBy: { date: "desc" },
      }),
    ]);

    // Group once instead of re-filtering the whole array per date.
    const metricsByDate = new Map<string, typeof metrics>();
    for (const metric of metrics) {
      const key = metric.date.toISOString();
      const list = metricsByDate.get(key) ?? [];
      list.push(metric);
      metricsByDate.set(key, list);
    }
    const dates = Array.from(metricsByDate.keys()).sort();

    const trend = dates.map((dateStr) => {
      const dateMetrics = metricsByDate.get(dateStr) ?? [];
      const row: any = { date: dateStr };

      const ownMetric = dateMetrics.find((m) => m.competitorId === null);
      row[business.name] = ownMetric ? ownMetric.sov : 0;

      for (const comp of business.competitors) {
        const compMetric = dateMetrics.find((m) => m.competitorId === comp.id);
        row[comp.name] = compMetric ? compMetric.sov : 0;
      }
      return row;
    });

    const latestDate = metrics[0]?.date ?? null;
    const breakdown = latestDate
      ? [
          {
            name: business.name,
            domain: business.domain,
            isSelf: true,
            metrics:
              metrics.find(
                (m) =>
                  m.competitorId === null &&
                  m.date.getTime() === latestDate.getTime(),
              ) ?? null,
          },
          ...business.competitors.map((comp) => ({
            name: comp.name,
            domain: comp.domain,
            isSelf: false,
            metrics:
              metrics.find(
                (m) =>
                  m.competitorId === comp.id &&
                  m.date.getTime() === latestDate.getTime(),
              ) ?? null,
          })),
        ]
      : [];

    return {
      trend,
      breakdown: breakdown.map((item) => ({
        name: item.name,
        domain: item.domain,
        isSelf: item.isSelf,
        mentionRate: item.metrics?.mentionRate ?? 0,
        citationShare: item.metrics?.citationShare ?? 0,
        sov: item.metrics?.sov ?? 0,
      })),
    };
  }
}
