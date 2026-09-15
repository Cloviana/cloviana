import { PrismaService } from "@/clients/prisma/prisma.service";
import { toRootDomain } from "@/common/utils/normalize-domain.util";
import { computeRate } from "@/common/visibility/visibility-metric-calculator";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BrandKind,
  ClaimSentiment,
  Prisma,
  PromptResponseStatus,
  PromptRunStatus,
  PromptStatus,
} from "@prisma/client";
import { GetPromptBrandPerceptionQueryDto } from "../dto/get-prompt-brand-perception-query.dto";
import {
  GetPromptMentionRateQueryDto,
  MentionRateGranularity,
} from "../dto/get-prompt-mention-rate-query.dto";
import { GetPromptRankingQueryDto } from "../dto/get-prompt-ranking-query.dto";
import {
  GetPromptSourceTypesQueryDto,
  GetPromptSourcesQueryDto,
  PromptSourceView,
} from "../dto/get-prompt-source-distribution-query.dto";
import {
  ListPromptsQueryDto,
  PromptStatusFilter,
} from "../dto/list-prompts-query.dto";
import {
  PaginationQueryDto,
  toPageInfo,
  toPageWindow,
} from "../dto/pagination-query.dto";
import { CreatePromptDto, UpdatePromptDto } from "../dto/prompt.dto";
import { calculatePromptMetrics } from "../prompt-metrics";

const PROMPT_METRIC_RUN_WINDOW = 7;

type SourceCount = {
  key: string;
  retrievals: number;
};

type SourceCountItem = {
  key: string;
  retrievals: number;
  previousRetrievals: number;
  change: number;
};

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toBucketDate(date: Date, granularity: MentionRateGranularity): string {
  const bucket = new Date(date);

  if (granularity === MentionRateGranularity.WEEK) {
    const daysSinceMonday = (bucket.getUTCDay() + 6) % 7;
    bucket.setUTCDate(bucket.getUTCDate() - daysSinceMonday);
  }

  if (granularity === MentionRateGranularity.MONTH) {
    bucket.setUTCDate(1);
  }

  return bucket.toISOString().slice(0, 10);
}

function rankSourceCounts(
  current: SourceCount[],
  previous: SourceCount[],
  view: PromptSourceView,
  limit: number,
): SourceCountItem[] {
  const currentByKey = new Map(
    current.map(({ key, retrievals }) => [key, retrievals]),
  );
  const previousByKey = new Map(
    previous.map(({ key, retrievals }) => [key, retrievals]),
  );
  const keys = new Set([...currentByKey.keys(), ...previousByKey.keys()]);

  return [...keys]
    .map((key) => {
      const retrievals = currentByKey.get(key) ?? 0;
      const previousRetrievals = previousByKey.get(key) ?? 0;

      return {
        key,
        retrievals,
        previousRetrievals,
        change: retrievals - previousRetrievals,
      };
    })
    .filter((item) => {
      if (view === PromptSourceView.NEW) {
        return item.retrievals > 0 && item.previousRetrievals === 0;
      }
      if (view === PromptSourceView.TRENDING) {
        return item.retrievals > 0 && item.change > 0;
      }
      if (view === PromptSourceView.LOSING) {
        return item.previousRetrievals > 0 && item.change < 0;
      }

      return item.retrievals > 0;
    })
    .sort((left, right) => {
      if (view === PromptSourceView.TRENDING) {
        return (
          right.change - left.change ||
          right.retrievals - left.retrievals ||
          left.key.localeCompare(right.key)
        );
      }
      if (view === PromptSourceView.LOSING) {
        return (
          left.change - right.change ||
          right.previousRetrievals - left.previousRetrievals ||
          left.key.localeCompare(right.key)
        );
      }

      return (
        right.retrievals - left.retrievals || left.key.localeCompare(right.key)
      );
    })
    .slice(0, limit);
}

const promptListSelect = {
  id: true,
  text: true,
  status: true,
  awarenessStage: true,
  branding: true,
  createdAt: true,
  business: {
    select: {
      brandKit: {
        select: {
          brands: {
            where: { kind: BrandKind.BUSINESS },
            select: { domain: true },
            take: 1,
          },
        },
      },
    },
  },
  promptTopics: {
    select: { topic: { select: { id: true, name: true } } },
  },
  promptTags: {
    select: { tag: { select: { id: true, text: true } } },
  },
  runs: {
    where: { status: PromptRunStatus.COMPLETED },
    select: {
      responses: {
        where: { status: PromptResponseStatus.SUCCESS },
        select: {
          webSearch: true,
          mentions: {
            select: { name: true, domain: true, order: true },
            orderBy: { order: "asc" },
          },
          citations: { select: { domain: true } },
          sentimentClaims: {
            select: { sentiment: true, brand: { select: { domain: true } } },
          },
        },
      },
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    take: PROMPT_METRIC_RUN_WINDOW,
  },
} satisfies Prisma.PromptSelect;

type PromptListRecord = Prisma.PromptGetPayload<{
  select: typeof promptListSelect;
}>;

function statusFilter(status?: PromptStatusFilter): PromptStatus | undefined {
  if (!status || status === PromptStatusFilter.ALL) {
    return undefined;
  }

  return status === PromptStatusFilter.ACTIVE
    ? PromptStatus.ACTIVE
    : PromptStatus.INACTIVE;
}

function someTopicIn(ids?: string[]) {
  return ids?.length ? { some: { topicId: { in: ids } } } : undefined;
}

function someTagIn(ids?: string[]) {
  return ids?.length ? { some: { tagId: { in: ids } } } : undefined;
}

function normalizePromptText(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new BadRequestException("Prompt text is required");
  }

  return normalized;
}

function rethrowPromptWriteError(
  error: unknown,
  notFoundMessage: string,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ConflictException("A prompt with this text already exists");
    }
    if (error.code === "P2025") {
      throw new NotFoundException(notFoundMessage);
    }
  }

  throw error;
}

function orderMentions<
  T extends { name: string; domain: string; order: number },
>(mentions: T[]): T[] {
  const byDomain = new Map<string, T>();

  for (const mention of mentions) {
    const current = byDomain.get(mention.domain);

    if (!current || mention.order < current.order) {
      byDomain.set(mention.domain, mention);
    }
  }

  return Array.from(byDomain.values()).sort((a, b) => a.order - b.order);
}

function mapPrompt(prompt: PromptListRecord) {
  const {
    status,
    awarenessStage,
    business,
    promptTopics,
    promptTags,
    runs,
    ...rest
  } = prompt;
  const businessBrand = business.brandKit?.brands[0];
  if (!businessBrand) {
    throw new Error("Prompt business is missing its BUSINESS brand");
  }
  const mainDomain = toRootDomain(businessBrand.domain);
  const latestMentions = (runs[0]?.responses ?? []).flatMap(
    (response) => response.mentions,
  );

  return {
    ...rest,
    stage: awarenessStage,
    active: status === PromptStatus.ACTIVE,
    topics: promptTopics
      .map(({ topic }) => topic)
      .sort((left, right) => left.name.localeCompare(right.name)),
    tags: promptTags
      .map(({ tag }) => tag)
      .sort((left, right) => left.text.localeCompare(right.text)),
    mentions: orderMentions(latestMentions),
    metrics: calculatePromptMetrics(
      runs.flatMap((run) => run.responses),
      mainDomain,
    ),
  };
}

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrompts(businessId: string, query: ListPromptsQueryDto) {
    const { page, limit, skip, take } = toPageWindow(query);
    const search = query.q?.trim();
    const where: Prisma.PromptWhereInput = {
      businessId,
      status: statusFilter(query.status),
      text: search
        ? { contains: search, mode: Prisma.QueryMode.insensitive }
        : undefined,
      promptTopics: someTopicIn(query.topicIds),
      promptTags: someTagIn(query.tagIds),
      branding: query.branding?.length ? { in: query.branding } : undefined,
      awarenessStage: query.stages?.length ? { in: query.stages } : undefined,
    };

    const [totalItems, records] = await this.prisma.$transaction([
      this.prisma.prompt.count({ where }),
      this.prisma.prompt.findMany({
        where,
        select: promptListSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
    ]);

    return {
      items: records.map(mapPrompt),
      pageInfo: toPageInfo(page, limit, totalItems),
    };
  }

  getPromptOptions(businessId: string) {
    return this.prisma.prompt.findMany({
      where: { businessId },
      select: { id: true, text: true },
      orderBy: { text: "asc" },
    });
  }

  async getPrompt(businessId: string, promptId: string) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, businessId },
      select: promptListSelect,
    });

    if (!prompt) {
      throw new NotFoundException("Prompt not found");
    }

    return mapPrompt(prompt);
  }

  async getPromptFanOutQueries(
    businessId: string,
    promptId: string,
    query: PaginationQueryDto,
  ) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, businessId },
      select: { id: true },
    });

    if (!prompt) {
      throw new NotFoundException("Prompt not found");
    }

    const { page, limit, skip, take } = toPageWindow(query);
    const where: Prisma.FanOutQueryWhereInput = {
      promptResponse: {
        promptRun: { promptId },
        status: PromptResponseStatus.SUCCESS,
      },
    };
    const [totalItems, records] = await this.prisma.$transaction([
      this.prisma.fanOutQuery.count({ where }),
      this.prisma.fanOutQuery.findMany({
        where,
        select: {
          id: true,
          query: true,
          promptResponse: { select: { engine: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
    ]);

    return {
      items: records.map(({ promptResponse, ...record }) => ({
        ...record,
        engine: promptResponse.engine,
      })),
      pageInfo: toPageInfo(page, limit, totalItems),
    };
  }

  async getPromptBrandPerception(
    businessId: string,
    promptId: string,
    query: GetPromptBrandPerceptionQueryDto,
  ) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, businessId },
      select: { id: true },
    });

    if (!prompt) {
      throw new NotFoundException("Prompt not found");
    }

    const { page, limit, skip, take } = toPageWindow(query);
    const where: Prisma.SentimentClaimWhereInput = {
      sentiment: query.sentiment,
      brand: { brandKit: { businessId }, kind: BrandKind.BUSINESS },
      promptResponse: {
        promptRun: { promptId },
        status: PromptResponseStatus.SUCCESS,
      },
    };
    const [totalItems, records] = await this.prisma.$transaction([
      this.prisma.sentimentClaim.count({ where }),
      this.prisma.sentimentClaim.findMany({
        where,
        select: {
          id: true,
          label: true,
          sentiment: true,
          promptResponse: { select: { engine: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
    ]);

    return {
      items: records.map(({ promptResponse, ...record }) => ({
        ...record,
        engine: promptResponse.engine,
      })),
      pageInfo: toPageInfo(page, limit, totalItems),
    };
  }

  async getPromptMentionRate(
    businessId: string,
    promptId: string,
    query: GetPromptMentionRateQueryDto,
  ) {
    const from = toUtcDate(query.from);
    const to = toUtcDate(query.to);

    if (from > to) {
      throw new BadRequestException("from must be on or before to");
    }

    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, businessId },
      select: {
        metrics: {
          where: { date: { gte: from, lte: to } },
          select: {
            date: true,
            mentionRate: true,
            brand: {
              select: { id: true, name: true, domain: true, kind: true },
            },
          },
          orderBy: [{ date: "asc" }, { brandId: "asc" }],
        },
      },
    });

    if (!prompt) {
      throw new NotFoundException("Prompt not found");
    }

    const seriesByBrand = new Map<
      string,
      {
        brand: (typeof prompt.metrics)[number]["brand"];
        buckets: Map<string, { total: number; count: number }>;
      }
    >();

    for (const metric of prompt.metrics) {
      const series = seriesByBrand.get(metric.brand.id) ?? {
        brand: metric.brand,
        buckets: new Map<string, { total: number; count: number }>(),
      };
      const date = toBucketDate(metric.date, query.granularity);
      const bucket = series.buckets.get(date) ?? { total: 0, count: 0 };

      bucket.total += metric.mentionRate;
      bucket.count += 1;
      series.buckets.set(date, bucket);
      seriesByBrand.set(metric.brand.id, series);
    }

    const series = [...seriesByBrand.values()]
      .sort(
        (left, right) =>
          left.brand.kind.localeCompare(right.brand.kind) ||
          left.brand.name.localeCompare(right.brand.name),
      )
      .map(({ brand, buckets }) => ({
        brand,
        points: [...buckets.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([date, bucket]) => ({
            date,
            mentionRate: bucket.total / bucket.count,
          })),
      }));

    return {
      from: query.from,
      to: query.to,
      granularity: query.granularity,
      series,
    };
  }

  async getPromptRanking(
    businessId: string,
    promptId: string,
    query: GetPromptRankingQueryDto,
  ) {
    const from = toUtcDate(query.from);
    const to = toUtcDate(query.to);

    if (from > to) {
      throw new BadRequestException("from must be on or before to");
    }

    const toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, businessId },
      select: {
        business: {
          select: {
            brandKit: {
              select: {
                brands: {
                  select: { id: true, name: true, domain: true, kind: true },
                  orderBy: { name: "asc" },
                },
              },
            },
          },
        },
        runs: {
          select: {
            responses: {
              where: {
                status: PromptResponseStatus.SUCCESS,
                createdAt: { gte: from, lt: toExclusive },
              },
              select: {
                mentions: { select: { brandId: true, order: true } },
                sentimentClaims: {
                  select: { brandId: true, sentiment: true },
                },
              },
            },
          },
        },
      },
    });

    if (!prompt) {
      throw new NotFoundException("Prompt not found");
    }

    const brands = prompt.business.brandKit?.brands;
    if (!brands) {
      throw new Error("Prompt business is missing its brand kit");
    }

    const responses = prompt.runs.flatMap((run) => run.responses);
    const responseCount = responses.length;

    if (responseCount === 0) {
      return {
        from: query.from,
        to: query.to,
        responseCount,
        items: [],
        mainBrand: null,
      };
    }

    const statsByBrandId = new Map(
      brands.map((brand) => [
        brand.id,
        {
          brand,
          mentionedResponseCount: 0,
          mentionCount: 0,
          positionTotal: 0,
          positionCount: 0,
          positiveClaimCount: 0,
          negativeClaimCount: 0,
        },
      ]),
    );
    let totalTrackedMentionCount = 0;

    for (const response of responses) {
      const mentionedBrandIds = new Set<string>();

      for (const mention of response.mentions) {
        const stats = statsByBrandId.get(mention.brandId);
        if (!stats) {
          continue;
        }

        mentionedBrandIds.add(mention.brandId);
        stats.mentionCount += 1;
        stats.positionTotal += mention.order;
        stats.positionCount += 1;
        totalTrackedMentionCount += 1;
      }

      for (const brandId of mentionedBrandIds) {
        const stats = statsByBrandId.get(brandId);
        if (stats) {
          stats.mentionedResponseCount += 1;
        }
      }

      for (const claim of response.sentimentClaims) {
        if (!claim.brandId) {
          continue;
        }

        const stats = statsByBrandId.get(claim.brandId);
        if (!stats) {
          continue;
        }

        if (claim.sentiment === ClaimSentiment.POSITIVE) {
          stats.positiveClaimCount += 1;
        } else if (claim.sentiment === ClaimSentiment.NEGATIVE) {
          stats.negativeClaimCount += 1;
        }
      }
    }

    const ranked = [...statsByBrandId.values()]
      .map((stats) => {
        const sentimentClaimCount =
          stats.positiveClaimCount + stats.negativeClaimCount;

        return {
          rank: 0,
          brand: stats.brand,
          mentionRate: computeRate(stats.mentionedResponseCount, responseCount),
          shareOfVoice: computeRate(
            stats.mentionCount,
            totalTrackedMentionCount,
          ),
          sentiment:
            sentimentClaimCount > 0
              ? computeRate(stats.positiveClaimCount, sentimentClaimCount)
              : null,
          position:
            stats.positionCount > 0
              ? stats.positionTotal / stats.positionCount
              : null,
        };
      })
      .sort((left, right) => {
        if (left.mentionRate !== right.mentionRate) {
          return right.mentionRate - left.mentionRate;
        }
        if (left.shareOfVoice !== right.shareOfVoice) {
          return right.shareOfVoice - left.shareOfVoice;
        }
        if (left.position === null && right.position !== null) {
          return 1;
        }
        if (left.position !== null && right.position === null) {
          return -1;
        }
        if (left.position !== null && right.position !== null) {
          const positionDifference = left.position - right.position;
          if (positionDifference !== 0) {
            return positionDifference;
          }
        }

        return left.brand.name.localeCompare(right.brand.name);
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return {
      from: query.from,
      to: query.to,
      responseCount,
      items: ranked.slice(0, 7),
      mainBrand:
        ranked.find((item) => item.brand.kind === BrandKind.BUSINESS) ?? null,
    };
  }

  async getPromptSourceDomains(
    businessId: string,
    promptId: string,
    query: GetPromptSourcesQueryDto,
  ) {
    const { currentResponseIds, previousResponseIds } =
      await this.getPromptSourceResponseIds(businessId, promptId, query);
    const [current, previous] = await Promise.all([
      this.getSourceDomainCounts(currentResponseIds),
      this.getSourceDomainCounts(previousResponseIds),
    ]);
    const items = rankSourceCounts(
      current.map(({ domain, _count }) => ({
        key: domain,
        retrievals: _count._all,
      })),
      previous.map(({ domain, _count }) => ({
        key: domain,
        retrievals: _count._all,
      })),
      query.view,
      query.limit,
    ).map(({ key, ...item }) => ({ domain: key, ...item }));

    return {
      from: query.from,
      to: query.to,
      view: query.view,
      items,
    };
  }

  async getPromptDomainTypes(
    businessId: string,
    promptId: string,
    query: GetPromptSourceTypesQueryDto,
  ) {
    const { currentResponseIds } = await this.getPromptSourceResponseIds(
      businessId,
      promptId,
      query,
    );
    const groups = currentResponseIds.length
      ? await this.prisma.citation.groupBy({
          by: ["domainType"],
          where: { promptResponseId: { in: currentResponseIds } },
          _count: { _all: true },
        })
      : [];
    const totalRetrievals = groups.reduce(
      (total, group) => total + group._count._all,
      0,
    );
    const unclassifiedRetrievals =
      groups.find((group) => group.domainType === null)?._count._all ?? 0;
    const items = groups
      .filter((group) => group.domainType !== null)
      .map((group) => ({
        type: group.domainType,
        retrievals: group._count._all,
        percentage: computeRate(group._count._all, totalRetrievals),
      }))
      .sort(
        (left, right) =>
          right.retrievals - left.retrievals ||
          left.type.localeCompare(right.type),
      );

    return {
      from: query.from,
      to: query.to,
      totalRetrievals,
      unclassifiedRetrievals,
      items,
    };
  }

  async getPromptSourceUrls(
    businessId: string,
    promptId: string,
    query: GetPromptSourcesQueryDto,
  ) {
    const { currentResponseIds, previousResponseIds } =
      await this.getPromptSourceResponseIds(businessId, promptId, query);
    const [current, previous] = await Promise.all([
      this.getSourceUrlCounts(currentResponseIds),
      this.getSourceUrlCounts(previousResponseIds),
    ]);
    const ranked = rankSourceCounts(
      current.map(({ canonicalUrl, _count }) => ({
        key: canonicalUrl,
        retrievals: _count._all,
      })),
      previous.map(({ canonicalUrl, _count }) => ({
        key: canonicalUrl,
        retrievals: _count._all,
      })),
      query.view,
      query.limit,
    );
    const urls = ranked.map((item) => item.key);
    const responseIds = [...currentResponseIds, ...previousResponseIds];
    const citations =
      urls.length > 0 && responseIds.length > 0
        ? await this.prisma.citation.findMany({
            where: {
              promptResponseId: { in: responseIds },
              canonicalUrl: { in: urls },
            },
            select: {
              canonicalUrl: true,
              domain: true,
              title: true,
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          })
        : [];
    const citationByUrl = new Map<
      string,
      { domain: string; title: string | null }
    >();

    for (const citation of citations) {
      if (!citationByUrl.has(citation.canonicalUrl)) {
        citationByUrl.set(citation.canonicalUrl, citation);
      }
    }

    const items = ranked.map(({ key, ...item }) => ({
      url: key,
      domain: citationByUrl.get(key)?.domain ?? "",
      title: citationByUrl.get(key)?.title ?? null,
      ...item,
    }));

    return {
      from: query.from,
      to: query.to,
      view: query.view,
      items,
    };
  }

  async getPromptUrlTypes(
    businessId: string,
    promptId: string,
    query: GetPromptSourceTypesQueryDto,
  ) {
    const { currentResponseIds } = await this.getPromptSourceResponseIds(
      businessId,
      promptId,
      query,
    );
    const groups = currentResponseIds.length
      ? await this.prisma.citation.groupBy({
          by: ["urlType"],
          where: { promptResponseId: { in: currentResponseIds } },
          _count: { _all: true },
        })
      : [];
    const totalRetrievals = groups.reduce(
      (total, group) => total + group._count._all,
      0,
    );
    const unclassifiedRetrievals =
      groups.find((group) => group.urlType === null)?._count._all ?? 0;
    const items = groups
      .filter((group) => group.urlType !== null)
      .map((group) => ({
        type: group.urlType,
        retrievals: group._count._all,
        percentage: computeRate(group._count._all, totalRetrievals),
      }))
      .sort(
        (left, right) =>
          right.retrievals - left.retrievals ||
          left.type.localeCompare(right.type),
      );

    return {
      from: query.from,
      to: query.to,
      totalRetrievals,
      unclassifiedRetrievals,
      items,
    };
  }

  private async getPromptSourceResponseIds(
    businessId: string,
    promptId: string,
    query: GetPromptSourceTypesQueryDto,
  ) {
    const from = toUtcDate(query.from);
    const to = toUtcDate(query.to);

    if (from > to) {
      throw new BadRequestException("from must be on or before to");
    }

    const toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    const rangeMilliseconds = toExclusive.getTime() - from.getTime();
    const previousFrom = new Date(from.getTime() - rangeMilliseconds);
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, businessId },
      select: {
        runs: {
          select: {
            responses: {
              where: {
                status: PromptResponseStatus.SUCCESS,
                createdAt: { gte: previousFrom, lt: toExclusive },
              },
              select: { id: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!prompt) {
      throw new NotFoundException("Prompt not found");
    }

    const currentResponseIds: string[] = [];
    const previousResponseIds: string[] = [];

    for (const response of prompt.runs.flatMap((run) => run.responses)) {
      if (response.createdAt >= from) {
        currentResponseIds.push(response.id);
      } else {
        previousResponseIds.push(response.id);
      }
    }

    return { currentResponseIds, previousResponseIds };
  }

  private getSourceDomainCounts(responseIds: string[]) {
    if (responseIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.citation.groupBy({
      by: ["domain"],
      where: { promptResponseId: { in: responseIds } },
      _count: { _all: true },
    });
  }

  private getSourceUrlCounts(responseIds: string[]) {
    if (responseIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.citation.groupBy({
      by: ["canonicalUrl"],
      where: { promptResponseId: { in: responseIds } },
      _count: { _all: true },
    });
  }

  async createPrompt(businessId: string, input: CreatePromptDto) {
    const text = normalizePromptText(input.text);
    const topicIds = input.topicIds ?? [];
    const tagIds = input.tagIds ?? [];

    try {
      const prompt = await this.prisma.$transaction(async (transaction) => {
        await this.assertRelationsBelongToBusiness(
          transaction,
          businessId,
          topicIds,
          tagIds,
        );

        const prompt = await transaction.prompt.create({
          data: {
            businessId,
            text,
            status: input.active ? PromptStatus.ACTIVE : PromptStatus.INACTIVE,
            awarenessStage: input.stage,
            branding: input.branding,
          },
          select: { id: true },
        });

        if (topicIds.length) {
          await transaction.promptTopic.createMany({
            data: topicIds.map((topicId) => ({
              promptId: prompt.id,
              topicId,
              businessId,
            })),
          });
        }
        if (tagIds.length) {
          await transaction.promptTag.createMany({
            data: tagIds.map((tagId) => ({
              promptId: prompt.id,
              tagId,
              businessId,
            })),
          });
        }

        return prompt;
      });

      return prompt;
    } catch (error) {
      rethrowPromptWriteError(error, "Prompt could not be created");
    }
  }

  async updatePrompt(
    businessId: string,
    promptId: string,
    update: UpdatePromptDto,
  ) {
    const data: Prisma.PromptUpdateInput = {};

    if (update.text !== undefined) {
      data.text = normalizePromptText(update.text);
    }
    if (update.stage !== undefined) {
      data.awarenessStage = update.stage;
    }
    if (update.branding !== undefined) {
      data.branding = update.branding;
    }
    if (update.active !== undefined) {
      data.status = update.active ? PromptStatus.ACTIVE : PromptStatus.INACTIVE;
    }

    const topicIds = update.topicIds;
    const tagIds = update.tagIds;

    if (
      Object.keys(data).length === 0 &&
      topicIds === undefined &&
      tagIds === undefined
    ) {
      throw new BadRequestException("No prompt changes were provided");
    }

    try {
      const prompt = await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.prompt.findFirst({
          where: { id: promptId, businessId },
          select: { id: true },
        });
        if (!existing) {
          throw new NotFoundException("Prompt not found");
        }

        await this.assertRelationsBelongToBusiness(
          transaction,
          businessId,
          topicIds ?? [],
          tagIds ?? [],
        );

        if (topicIds !== undefined) {
          await transaction.promptTopic.deleteMany({ where: { promptId } });
          if (topicIds.length) {
            await transaction.promptTopic.createMany({
              data: topicIds.map((topicId) => ({
                promptId,
                topicId,
                businessId,
              })),
            });
          }
        }

        if (tagIds !== undefined) {
          await transaction.promptTag.deleteMany({ where: { promptId } });
          if (tagIds.length) {
            await transaction.promptTag.createMany({
              data: tagIds.map((tagId) => ({
                promptId,
                tagId,
                businessId,
              })),
            });
          }
        }

        return Object.keys(data).length
          ? transaction.prompt.update({
              where: { id: promptId },
              data,
              select: { id: true },
            })
          : existing;
      });

      return prompt;
    } catch (error) {
      rethrowPromptWriteError(error, "Prompt not found");
    }
  }

  setPromptsActive(businessId: string, promptIds: string[], active: boolean) {
    const status = active ? PromptStatus.ACTIVE : PromptStatus.INACTIVE;

    return this.writeAllOrNothing(promptIds, (transaction, ids) =>
      transaction.prompt.updateMany({
        where: { id: { in: ids }, businessId },
        data: { status },
      }),
    );
  }

  deletePrompts(businessId: string, promptIds: string[]) {
    return this.writeAllOrNothing(promptIds, (transaction, ids) =>
      transaction.prompt.deleteMany({
        where: { id: { in: ids }, businessId },
      }),
    );
  }

  private writeAllOrNothing(
    promptIds: string[],
    write: (
      transaction: Prisma.TransactionClient,
      ids: string[],
    ) => Promise<{ count: number }>,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const { count } = await write(transaction, promptIds);

      if (count !== promptIds.length) {
        throw new NotFoundException("Some prompts were not found");
      }

      return { count };
    });
  }

  private async assertRelationsBelongToBusiness(
    transaction: Prisma.TransactionClient,
    businessId: string,
    topicIds: string[],
    tagIds: string[],
  ): Promise<void> {
    const [topicCount, tagCount] = await Promise.all([
      topicIds.length
        ? transaction.topic.count({
            where: { businessId, id: { in: topicIds } },
          })
        : 0,
      tagIds.length
        ? transaction.tag.count({ where: { businessId, id: { in: tagIds } } })
        : 0,
    ]);

    if (topicCount !== topicIds.length) {
      throw new BadRequestException(
        "One or more topics do not belong to this business",
      );
    }
    if (tagCount !== tagIds.length) {
      throw new BadRequestException(
        "One or more tags do not belong to this business",
      );
    }
  }
}
