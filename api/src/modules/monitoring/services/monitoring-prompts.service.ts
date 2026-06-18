import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { PromptResponseStatus, PromptStatus } from "@prisma/client";

@Injectable()
export class MonitoringPromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPromptsOverview(businessId: string) {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        name: true,
        domain: true,
        competitors: {
          select: { id: true, name: true, domain: true },
          orderBy: { createdAt: "asc" },
        },
        prompts: {
          include: {
            tags: { select: { id: true, text: true } },
            metrics: {
              where: { competitorId: null },
              orderBy: { date: "desc" },
              take: 1,
            },
            runs: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: {
                responses: {
                  orderBy: { engine: "asc" },
                  include: {
                    citations: { orderBy: { position: "asc" } },
                    mentions: { orderBy: { position: "asc" } },
                    fanOutQueries: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const competitorByDomain = new Map(
      business.competitors.map((competitor) => [competitor.domain, competitor]),
    );

    const prompts = business.prompts.map((prompt) => {
      const latestRun = prompt.runs[0] ?? null;
      const metric = prompt.metrics[0] ?? null;

      const responses: any[] = [];
      const enginesSeen = new Set<string>();
      for (const run of prompt.runs) {
        for (const response of run.responses) {
          if (!enginesSeen.has(response.engine)) {
            enginesSeen.add(response.engine);
            responses.push(response);
          }
        }
      }

      const successfulResponses = responses.filter(
        (response) => response.status === PromptResponseStatus.SUCCESS,
      );

      const engineBreakdown = responses.map((response) => {
        const ownMentioned = response.mentions.some(
          (mention) =>
            mention.domain === business.domain ||
            mention.name.toLowerCase() === business.name.toLowerCase(),
        );
        const ownCitations = response.citations.filter(
          (citation) => citation.domain === business.domain,
        );

        const competitorMentions = response.mentions
          .filter(
            (mention) =>
              mention.competitorId || competitorByDomain.has(mention.domain),
          )
          .map((mention) => ({
            id: mention.id,
            name: mention.name,
            domain: mention.domain,
            position: mention.position,
            competitorId: mention.competitorId,
          }));

        return {
          engine: response.engine,
          status: response.status,
          createdAt: response.createdAt,
          mentionRate: ownMentioned ? 100 : 0,
          citationShare:
            response.citations.length > 0
              ? (ownCitations.length / response.citations.length) * 100
              : 0,
          sov:
            response.mentions.length > 0 && ownMentioned
              ? (1 / response.mentions.length) * 100
              : 0,
          text: response.text,
          error: response.error,
          fanOutQueries: response.fanOutQueries.map((query) => query.query),
          mentions: response.mentions.map((mention) => ({
            id: mention.id,
            name: mention.name,
            domain: mention.domain,
            position: mention.position,
            competitorId: mention.competitorId,
            isOwn:
              mention.domain === business.domain ||
              mention.name.toLowerCase() === business.name.toLowerCase(),
            isCompetitor:
              Boolean(mention.competitorId) ||
              competitorByDomain.has(mention.domain),
          })),
          competitorMentions,
          citations: response.citations.map((citation) => ({
            id: citation.id,
            url: citation.url,
            domain: citation.domain,
            title: citation.title,
            position: citation.position,
            isOwn: citation.domain === business.domain,
            isCompetitor: competitorByDomain.has(citation.domain),
          })),
        };
      });

      const ownMentionResponses = engineBreakdown.filter(
        (response) => response.mentionRate > 0,
      ).length;
      const ownCitationResponses = engineBreakdown.filter(
        (response) => response.citationShare > 0,
      ).length;

      return {
        id: prompt.id,
        text: prompt.text,
        status: prompt.status,
        awarenessStage: prompt.awarenessStage,
        lastRunAt: prompt.lastRunAt,
        latestRun: latestRun
          ? {
              id: latestRun.id,
              status: latestRun.status,
              createdAt: latestRun.createdAt,
              completedAt: latestRun.completedAt,
            }
          : null,
        topics: prompt.tags.map((tag) => ({ id: tag.id, name: tag.text })),
        metrics: {
          date: metric?.date ?? null,
          mentionRate:
            metric?.mentionRate ??
            (successfulResponses.length > 0
              ? (ownMentionResponses / successfulResponses.length) * 100
              : 0),
          citationShare:
            metric?.citationShare ??
            (successfulResponses.length > 0
              ? (ownCitationResponses / successfulResponses.length) * 100
              : 0),
          sov: metric?.sov ?? 0,
        },
        engines: engineBreakdown,
      };
    });

    return {
      business: {
        name: business.name,
        domain: business.domain,
      },
      totalPrompts: prompts.length,
      totalResponses: prompts.reduce(
        (count, prompt) => count + prompt.engines.length,
        0,
      ),
      prompts,
    };
  }
}
