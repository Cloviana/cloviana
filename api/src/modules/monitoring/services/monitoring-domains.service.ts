import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { PromptStatus } from "@prisma/client";

@Injectable()
export class MonitoringDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDomainsOverview(businessId: string) {
    const activePrompts = await this.prisma.prompt.findMany({
      where: { businessId, status: PromptStatus.ACTIVE },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            responses: {
              include: {
                citations: true,
              },
            },
          },
        },
      },
    });

    const N = activePrompts.length;
    if (N === 0) {
      return {
        totalPrompts: 0,
        totalRetrievals: 0,
        topDomains: [],
        domainTypes: [],
        domainMovers: { top: [], new: [], trending: [], losing: [] },
      };
    }

    const domainStats = new Map<
      string,
      { totalCitations: number; retrievedInPrompts: Set<string> }
    >();

    for (const prompt of activePrompts) {
      const latestRun = prompt.runs[0];
      if (!latestRun) continue;

      for (const response of latestRun.responses) {
        for (const citation of response.citations) {
          const domain = citation.domain;
          let stats = domainStats.get(domain);
          if (!stats) {
            stats = {
              totalCitations: 0,
              retrievedInPrompts: new Set(),
            };
            domainStats.set(domain, stats);
          }
          stats.totalCitations += 1;
          stats.retrievedInPrompts.add(prompt.id);
        }
      }
    }

    const result = Array.from(domainStats.entries()).map(([domain, stats]) => {
      const retrievals = stats.retrievedInPrompts.size;
      const retrievedPct = N > 0 ? (retrievals / N) * 100 : 0;
      const citationRate =
        retrievals > 0 ? stats.totalCitations / retrievals : 0;

      return {
        domain,
        retrievals,
        retrieved: retrievedPct,
        citationRate: citationRate,
      };
    });

    result.sort((a, b) => b.retrieved - a.retrieved);

    const topDomains = result.slice(0, 50);

    const totalRetrievals = result.reduce(
      (acc, curr) => acc + curr.retrievals,
      0,
    );
    const top = [...result]
      .sort((a, b) => b.retrievals - a.retrievals)
      .slice(0, 10);
    const trending = [...result]
      .sort((a, b) => b.citationRate - a.citationRate)
      .slice(0, 10);
    const losing = [...result]
      .sort((a, b) => a.retrieved - b.retrieved)
      .slice(0, 10);
    const newMovers = result.filter((r) => r.retrievals < 3).slice(0, 10);

    return {
      totalPrompts: N,
      totalRetrievals,
      topDomains,
      domainTypes: [],
      domainMovers: {
        top,
        new: newMovers,
        trending,
        losing,
      },
    };
  }

  async getRecentChats(businessId: string) {
    const activePrompts = await this.prisma.prompt.findMany({
      where: { businessId, status: PromptStatus.ACTIVE },
      select: { id: true, text: true },
    });

    const promptMap = new Map(activePrompts.map((p) => [p.id, p.text]));
    const promptIds = Array.from(promptMap.keys());

    const recentResponses = await this.prisma.promptResponse.findMany({
      where: {
        promptId: { in: promptIds },
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        citations: true,
        mentions: true,
      },
    });

    return recentResponses.map((r) => ({
      id: r.id,
      promptId: r.promptId,
      promptText: promptMap.get(r.promptId) || "",
      engine: r.engine,
      text: r.text,
      createdAt: r.createdAt,
      citationsCount: r.citations.length,
      mentionsCount: r.mentions.length,
    }));
  }

  async getUrlsOverview(businessId: string) {
    const activePrompts = await this.prisma.prompt.findMany({
      where: { businessId, status: PromptStatus.ACTIVE },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            responses: {
              include: {
                citations: true,
              },
            },
          },
        },
      },
    });

    const urlStats = new Map<string, { domain: string; count: number; title: string | null }>();

    for (const prompt of activePrompts) {
      const latestRun = prompt.runs[0];
      if (!latestRun) continue;

      for (const response of latestRun.responses) {
        for (const citation of response.citations) {
          const url = citation.url;
          let stats = urlStats.get(url);
          if (!stats) {
            stats = { domain: citation.domain, count: 0, title: citation.title };
            urlStats.set(url, stats);
          }
          stats.count += 1;
        }
      }
    }

    const result = Array.from(urlStats.entries()).map(([url, stats]) => ({
      url,
      domain: stats.domain,
      count: stats.count,
      title: stats.title,
    }));

    result.sort((a, b) => b.count - a.count);

    return result.slice(0, 50);
  }
}
