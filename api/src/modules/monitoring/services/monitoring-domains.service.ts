import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import {
  AiEngine,
  DomainType,
  PromptResponseStatus,
  PromptStatus,
} from "@prisma/client";

type MonitoringRange = "D" | "W" | "M";
type SourceKind = "domains" | "hosts" | "urls";
type SourceOwnerType = "OWN" | "COMPETITOR" | "THIRD_PARTY";

type SourceQuery = {
  engine?: AiEngine | "ALL";
  range?: MonitoringRange;
  page?: number;
  limit?: number;
  search?: string;
  type?: DomainType | "ALL";
  urlType?: string | "ALL";
  owner?: SourceOwnerType | "ALL";
  minCompetitors?: number;
};

type SourcePromptStats = {
  id: string;
  text: string;
  count: number;
};

type SourceStats = {
  key: string;
  domain: string;
  url: string | null;
  title: string | null;
  citationCount: number;
  retrievals: Set<string>;
  engines: Set<AiEngine>;
  prompts: Map<string, SourcePromptStats>;
  competitors: Set<string>;
};

const CHART_COLORS = [
  "#f59e0b",
  "#d946ef",
  "#6b7280",
  "#3b82f6",
  "#eab308",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

@Injectable()
export class MonitoringDomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDomainsOverview(businessId: string, query: SourceQuery = {}) {
    return this.getSourceOverview(businessId, "domains", query);
  }

  async getHostsOverview(businessId: string, query: SourceQuery = {}) {
    return this.getSourceOverview(businessId, "hosts", query);
  }

  async getUrlsOverview(businessId: string, query: SourceQuery = {}) {
    return this.getSourceOverview(businessId, "urls", query);
  }

  async getRecentChats(
    businessId: string,
    query: Pick<SourceQuery, "engine" | "page" | "limit" | "search"> & {
      topicId?: string;
    } = {},
  ) {
    const page = normalisePage(query.page);
    const limit = normaliseLimit(query.limit, 10, 50);
    const search = query.search?.trim();
    const promptWhere: any = {
      businessId,
      status: PromptStatus.ACTIVE,
      ...(query.topicId && query.topicId !== "ALL"
        ? { tags: { some: { id: query.topicId } } }
        : {}),
      ...(search ? { text: { contains: search, mode: "insensitive" } } : {}),
    };

    const activePrompts = await this.prisma.prompt.findMany({
      where: promptWhere,
      select: { id: true, text: true },
    });

    const promptMap = new Map(activePrompts.map((p) => [p.id, p.text]));
    const promptIds = Array.from(promptMap.keys());

    if (promptIds.length === 0) {
      return paginated([], 0, page, limit);
    }

    const where: any = {
      promptId: { in: promptIds },
      status: PromptResponseStatus.SUCCESS,
      ...(query.engine && query.engine !== "ALL"
        ? { engine: query.engine }
        : {}),
    };

    const [total, recentResponses] = await Promise.all([
      this.prisma.promptResponse.count({ where }),
      this.prisma.promptResponse.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          citations: true,
          mentions: true,
        },
      }),
    ]);

    return paginated(
      recentResponses.map((r) => ({
        id: r.id,
        promptId: r.promptId,
        promptText: promptMap.get(r.promptId) || "",
        engine: r.engine,
        text: r.text ?? "",
        createdAt: r.createdAt,
        citationsCount: r.citations.length,
        mentionsCount: r.mentions.length,
      })),
      total,
      page,
      limit,
    );
  }

  async getSourceGaps(
    businessId: string,
    kind: SourceKind,
    query: SourceQuery = {},
  ) {
    const range = normaliseRange(query.range);
    const { start } = getRangeWindow(range);
    const page = normalisePage(query.page);
    const limit = normaliseLimit(query.limit, 15, 100);
    const minCompetitors = Math.max(0, query.minCompetitors ?? 1);

    const { business, competitorByDomain, responses, typeMap } =
      await this.getResponseContext(businessId, {
        ...query,
        range,
        start,
      });

    const stats = new Map<string, SourceStats>();
    const ownDomain = normaliseDomain(business.domain);
    const ownName = business.name.toLowerCase();

    for (const response of responses) {
      const ownMentioned =
        response.mentions.some(
          (mention) =>
            normaliseDomain(mention.domain) === ownDomain ||
            mention.name.toLowerCase() === ownName,
        ) ||
        response.citations.some(
          (citation) => normaliseDomain(citation.domain) === ownDomain,
        );

      if (ownMentioned) continue;

      const competitors = new Set<string>();
      for (const mention of response.mentions) {
        const competitor = competitorByDomain.get(
          normaliseDomain(mention.domain),
        );
        if (mention.competitorId || competitor) {
          competitors.add(competitor?.name ?? mention.name);
        }
      }
      for (const citation of response.citations) {
        const competitor = competitorByDomain.get(
          normaliseDomain(citation.domain),
        );
        if (competitor) competitors.add(competitor.name);
      }

      if (competitors.size < minCompetitors) continue;

      for (const citation of response.citations) {
        if (normaliseDomain(citation.domain) === ownDomain) continue;

        const sourceKey = getSourceKey(kind, citation.url, citation.domain);
        const current =
          stats.get(sourceKey) ??
          createSourceStats(sourceKey, citation.domain, citation.url);
        current.title = current.title ?? citation.title;
        current.citationCount += 1;
        current.retrievals.add(response.id);
        current.engines.add(response.engine);
        for (const competitor of competitors)
          current.competitors.add(competitor);

        const promptStats = current.prompts.get(response.promptId) ?? {
          id: response.promptId,
          text: response.prompt.text,
          count: 0,
        };
        promptStats.count += 1;
        current.prompts.set(response.promptId, promptStats);
        stats.set(sourceKey, current);
      }
    }

    const allItems = Array.from(stats.values())
      .map((item) => toGapItem(item, kind, business.domain, typeMap))
      .filter((item) => {
        const search = query.search?.trim().toLowerCase();
        const matchesSearch =
          !search ||
          item.source.toLowerCase().includes(search) ||
          item.domain.toLowerCase().includes(search) ||
          item.title?.toLowerCase().includes(search);
        const matchesType =
          !query.type || query.type === "ALL" || item.domainType === query.type;
        const matchesUrlType =
          !query.urlType ||
          query.urlType === "ALL" ||
          item.urlType === query.urlType;
        return matchesSearch && matchesType && matchesUrlType;
      })
      .sort((a, b) => b.gapScore - a.gapScore);

    const pageItems = allItems.slice((page - 1) * limit, page * limit);

    return {
      kind,
      ...paginated(pageItems, allItems.length, page, limit),
    };
  }

  private async getSourceOverview(
    businessId: string,
    kind: SourceKind,
    query: SourceQuery,
  ) {
    const range = normaliseRange(query.range);
    const { start, buckets } = getRangeWindow(range);
    const page = normalisePage(query.page);
    const limit = normaliseLimit(query.limit, 15, 100);

    const { business, competitorByDomain, responses, typeMap } =
      await this.getResponseContext(businessId, {
        ...query,
        range,
        start,
      });

    const stats = new Map<string, SourceStats>();

    for (const response of responses) {
      for (const citation of response.citations) {
        const sourceKey = getSourceKey(kind, citation.url, citation.domain);
        const current =
          stats.get(sourceKey) ??
          createSourceStats(sourceKey, citation.domain, citation.url);
        current.title = current.title ?? citation.title;
        current.citationCount += 1;
        current.retrievals.add(response.id);
        current.engines.add(response.engine);

        const competitor = competitorByDomain.get(
          normaliseDomain(citation.domain),
        );
        if (competitor) current.competitors.add(competitor.name);

        const promptStats = current.prompts.get(response.promptId) ?? {
          id: response.promptId,
          text: response.prompt.text,
          count: 0,
        };
        promptStats.count += 1;
        current.prompts.set(response.promptId, promptStats);
        stats.set(sourceKey, current);
      }
    }

    const responseCount = Math.max(responses.length, 1);
    const allItems = Array.from(stats.values())
      .map((item) =>
        toSourceItem(
          item,
          kind,
          business.domain,
          competitorByDomain,
          typeMap,
          responseCount,
        ),
      )
      .filter((item) => {
        const search = query.search?.trim().toLowerCase();
        const matchesSearch =
          !search ||
          item.source.toLowerCase().includes(search) ||
          item.domain.toLowerCase().includes(search) ||
          item.title?.toLowerCase().includes(search) ||
          item.competitorName?.toLowerCase().includes(search);
        const matchesType =
          !query.type || query.type === "ALL" || item.type === query.type;
        const matchesUrlType =
          !query.urlType ||
          query.urlType === "ALL" ||
          item.urlType === query.urlType;
        const matchesOwner =
          !query.owner ||
          query.owner === "ALL" ||
          item.ownerType === query.owner;
        return matchesSearch && matchesType && matchesUrlType && matchesOwner;
      })
      .sort((a, b) => b.retrievals - a.retrievals);

    const seriesItems = allItems.slice(0, 10);
    const series = seriesItems.map((item, index) => ({
      key: `series_${index}`,
      label: item.source,
      domain: item.domain,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
    const seriesKeyBySource = new Map(
      seriesItems.map((item, index) => [item.key, `series_${index}`]),
    );
    const trend = buildTrend(kind, responses, buckets, seriesKeyBySource);
    const domainTypes = buildTypeDistribution(allItems);
    const movers = buildMovers(allItems);
    const pageItems = allItems.slice((page - 1) * limit, page * limit);
    const totalRetrievals = allItems.reduce(
      (total, item) => total + item.retrievals,
      0,
    );
    const totalCitations = allItems.reduce(
      (total, item) => total + item.citationCount,
      0,
    );

    return {
      kind,
      range,
      totalPrompts: new Set(responses.map((r) => r.promptId)).size,
      totalResponses: responses.length,
      totalRetrievals,
      totalCitations,
      items: pageItems,
      total: allItems.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(allItems.length / limit)),
      topDomains: allItems.slice(0, 50),
      topUrls: allItems.slice(0, 50),
      series,
      trend,
      domainTypes,
      urlTypes: domainTypes,
      domainMovers: movers,
      urlMovers: movers,
    };
  }

  private async getResponseContext(
    businessId: string,
    query: SourceQuery & { start: Date },
  ) {
    const [business, activePrompts] = await Promise.all([
      this.prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        select: {
          name: true,
          domain: true,
          competitors: { select: { name: true, domain: true } },
        },
      }),
      this.prisma.prompt.findMany({
        where: { businessId, status: PromptStatus.ACTIVE },
        select: { id: true },
      }),
    ]);

    const promptIds = activePrompts.map((prompt) => prompt.id);
    const responses =
      promptIds.length === 0
        ? []
        : await this.prisma.promptResponse.findMany({
            where: {
              promptId: { in: promptIds },
              status: PromptResponseStatus.SUCCESS,
              createdAt: { gte: query.start },
              ...(query.engine && query.engine !== "ALL"
                ? { engine: query.engine }
                : {}),
            },
            orderBy: { createdAt: "asc" },
            include: {
              prompt: { select: { id: true, text: true } },
              citations: { orderBy: { position: "asc" } },
              mentions: { orderBy: { position: "asc" } },
            },
          });

    const domains = Array.from(
      new Set(
        responses.flatMap((response) =>
          response.citations.map((citation) =>
            normaliseDomain(citation.domain),
          ),
        ),
      ),
    );
    const domainInfos =
      domains.length === 0
        ? []
        : await this.prisma.domainInfo.findMany({
            where: { domain: { in: domains } },
          });

    const typeMap = new Map(
      domainInfos.map((info) => [normaliseDomain(info.domain), info.type]),
    );
    const competitorByDomain = new Map(
      business.competitors.map((competitor) => [
        normaliseDomain(competitor.domain),
        competitor,
      ]),
    );

    return { business, competitorByDomain, responses, typeMap };
  }
}

function createSourceStats(
  key: string,
  domain: string,
  url: string | null,
): SourceStats {
  return {
    key,
    domain: normaliseDomain(domain),
    url,
    title: null,
    citationCount: 0,
    retrievals: new Set(),
    engines: new Set(),
    prompts: new Map(),
    competitors: new Set(),
  };
}

function toSourceItem(
  stats: SourceStats,
  kind: SourceKind,
  businessDomain: string,
  competitorByDomain: Map<string, { name: string; domain: string }>,
  typeMap: Map<string, DomainType>,
  responseCount: number,
) {
  const ownerType = getOwnerType(
    stats.domain,
    businessDomain,
    competitorByDomain,
  );
  const retrievals = stats.retrievals.size;
  const type = typeMap.get(stats.domain) ?? DomainType.OTHER;

  return {
    key: stats.key,
    source: kind === "urls" ? (stats.url ?? stats.domain) : stats.domain,
    domain: stats.domain,
    url: stats.url,
    title: stats.title,
    urlType: kind === "urls" ? classifyUrl(stats.url, stats.title) : null,
    ownerType,
    competitorName: competitorByDomain.get(stats.domain)?.name ?? null,
    retrievals,
    retrieved: responseCount > 0 ? (retrievals / responseCount) * 100 : 0,
    citationRate: retrievals > 0 ? stats.citationCount / retrievals : 0,
    citationCount: stats.citationCount,
    type,
    engines: [...stats.engines],
    prompts: [...stats.prompts.values()].sort((a, b) => b.count - a.count),
  };
}

function toGapItem(
  stats: SourceStats,
  kind: SourceKind,
  businessDomain: string,
  typeMap: Map<string, DomainType>,
) {
  const retrievals = stats.retrievals.size;
  const domainType = typeMap.get(stats.domain) ?? DomainType.OTHER;
  const source = kind === "urls" ? (stats.url ?? stats.domain) : stats.domain;
  const competitorCount = stats.competitors.size;

  return {
    key: stats.key,
    source,
    domain: stats.domain,
    url: stats.url,
    title: stats.title,
    urlType: kind === "urls" ? classifyUrl(stats.url, stats.title) : null,
    domainType,
    ownerType:
      normaliseDomain(stats.domain) === normaliseDomain(businessDomain)
        ? "OWN"
        : "COMPETITOR",
    competitors: [...stats.competitors],
    mentions: competitorCount,
    retrievals,
    citationRate: retrievals > 0 ? stats.citationCount / retrievals : 0,
    gapScore: Math.round(retrievals * Math.max(1, competitorCount) * 10),
    engines: [...stats.engines],
  };
}

function buildTrend(
  kind: SourceKind,
  responses: Array<{
    id: string;
    createdAt: Date;
    citations: Array<{ url: string; domain: string }>;
  }>,
  buckets: Array<{ key: string; label: string }>,
  seriesKeyBySource: Map<string, string>,
) {
  const bucketMap = new Map(
    buckets.map((bucket) => [
      bucket.key,
      { bucket: bucket.key, label: bucket.label },
    ]),
  );

  for (const response of responses) {
    const bucket = bucketMap.get(bucketKey(response.createdAt, buckets));
    if (!bucket) continue;

    const seenInResponse = new Set<string>();
    for (const citation of response.citations) {
      const sourceKey = getSourceKey(kind, citation.url, citation.domain);
      const seriesKey = seriesKeyBySource.get(sourceKey);
      if (!seriesKey || seenInResponse.has(seriesKey)) continue;
      seenInResponse.add(seriesKey);
      bucket[seriesKey] = ((bucket[seriesKey] as number | undefined) ?? 0) + 1;
    }
  }

  return Array.from(bucketMap.values()).map((point) => {
    for (const seriesKey of seriesKeyBySource.values()) {
      point[seriesKey] = (point[seriesKey] as number | undefined) ?? 0;
    }
    return point;
  });
}

function buildTypeDistribution(
  items: Array<{ type: DomainType; retrievals: number }>,
) {
  const total = items.reduce((sum, item) => sum + item.retrievals, 0);
  const counts = new Map<DomainType, number>();
  for (const item of items) {
    counts.set(item.type, (counts.get(item.type) ?? 0) + item.retrievals);
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildMovers<T extends { retrievals: number; citationRate: number }>(
  items: T[],
) {
  return {
    top: [...items].sort((a, b) => b.retrievals - a.retrievals).slice(0, 10),
    new: [...items].filter((item) => item.retrievals <= 2).slice(0, 10),
    trending: [...items]
      .sort((a, b) => b.citationRate - a.citationRate)
      .slice(0, 10),
    losing: [...items].sort((a, b) => a.retrievals - b.retrievals).slice(0, 10),
  };
}

function getSourceKey(kind: SourceKind, url: string, domain: string) {
  if (kind === "urls") return url;
  if (kind === "hosts") return hostFromUrl(url) ?? normaliseDomain(domain);
  return normaliseDomain(domain);
}

function getOwnerType(
  domain: string,
  businessDomain: string,
  competitorByDomain: Map<string, { name: string; domain: string }>,
): SourceOwnerType {
  if (normaliseDomain(domain) === normaliseDomain(businessDomain)) return "OWN";
  if (competitorByDomain.has(normaliseDomain(domain))) return "COMPETITOR";
  return "THIRD_PARTY";
}

function hostFromUrl(url: string) {
  try {
    return normaliseDomain(new URL(url).hostname);
  } catch {
    return null;
  }
}

function normaliseDomain(domain: string | null | undefined) {
  return (domain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function classifyUrl(url: string | null, title: string | null) {
  const value = `${title ?? ""} ${url ?? ""}`.toLowerCase();
  if (/best|top|tools|software|platforms|alternatives/.test(value))
    return "Listicle";
  if (/compare|comparison|vs|versus/.test(value)) return "Comparison";
  if (/guide|how-to|how to|tutorial/.test(value)) return "How-To Guide";
  if (/docs|documentation|developer|api/.test(value)) return "Documentation";
  if (/review|ratings/.test(value)) return "Review";
  return "Other";
}

function normaliseRange(range?: string): MonitoringRange {
  return range === "D" || range === "W" || range === "M" ? range : "M";
}

function normalisePage(page?: number) {
  return Math.max(1, Number(page) || 1);
}

function normaliseLimit(limit?: number, fallback = 15, max = 100) {
  const value = Number(limit) || fallback;
  return Math.min(max, Math.max(1, value));
}

function paginated<T>(items: T[], total: number, page: number, limit: number) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function getRangeWindow(range: MonitoringRange) {
  const end = new Date();
  const start = new Date(end);

  if (range === "D") {
    start.setDate(start.getDate() - 6);
  } else if (range === "W") {
    start.setDate(start.getDate() - 7 * 7);
  } else {
    start.setMonth(start.getMonth() - 5);
  }

  start.setHours(0, 0, 0, 0);

  const buckets: Array<{ key: string; label: string }> = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key =
      range === "M"
        ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
        : range === "W"
          ? weekKey(cursor)
          : dateKey(cursor);

    if (!buckets.some((bucket) => bucket.key === key)) {
      buckets.push({
        key,
        label:
          range === "M"
            ? cursor.toLocaleDateString("en", { month: "short" })
            : cursor.toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              }),
      });
    }

    if (range === "M") cursor.setMonth(cursor.getMonth() + 1);
    else if (range === "W") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
  }

  return { start, end, buckets };
}

function bucketKey(date: Date, buckets: Array<{ key: string; label: string }>) {
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (buckets.some((bucket) => bucket.key === month)) return month;

  const week = weekKey(date);
  if (buckets.some((bucket) => bucket.key === week)) return week;

  return dateKey(date);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekKey(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return dateKey(start);
}
