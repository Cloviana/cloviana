import { PrismaService } from "@/clients/prisma/prisma.service";
import { toRootDomain } from "@/common/utils/normalize-domain.util";
import { Injectable, NotFoundException } from "@nestjs/common";
import { BrandKind, Prisma, PromptResponseStatus } from "@prisma/client";
import { ListPromptResponsesQueryDto } from "../dto/list-prompt-responses-query.dto";
import { toPageInfo, toPageWindow } from "../dto/pagination-query.dto";
import { calculatePromptMetrics, sentimentByBrandId } from "../prompt-metrics";

const RESPONSE_PREVIEW_LENGTH = 320;

const promptResponseListSelect = {
  id: true,
  engine: true,
  text: true,
  webSearch: true,
  createdAt: true,
  promptRun: {
    select: {
      prompt: {
        select: {
          text: true,
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
        },
      },
    },
  },
  mentions: {
    select: { name: true, domain: true, order: true },
    orderBy: { order: "asc" },
  },
  citations: { select: { domain: true }, orderBy: { order: "asc" } },
  sentimentClaims: {
    select: { sentiment: true, brand: { select: { domain: true } } },
  },
} satisfies Prisma.PromptResponseSelect;

const promptResponseDetailSelect = {
  id: true,
  engine: true,
  text: true,
  webSearch: true,
  createdAt: true,
  promptRun: {
    select: {
      prompt: {
        select: {
          text: true,
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
        },
      },
    },
  },
  mentions: {
    select: {
      id: true,
      name: true,
      domain: true,
      order: true,
      brandId: true,
      brand: { select: { name: true, aliases: true, kind: true } },
    },
    orderBy: { order: "asc" },
  },
  citations: {
    select: {
      id: true,
      url: true,
      domain: true,
      title: true,
    },
    orderBy: { order: "asc" },
  },
  fanOutQueries: {
    select: { id: true, query: true, inferred: true },
    orderBy: { createdAt: "asc" },
  },
  sentimentClaims: {
    select: {
      brandId: true,
      brand: { select: { domain: true } },
      sentiment: true,
    },
  },
} satisfies Prisma.PromptResponseSelect;

type PromptResponseListRecord = Prisma.PromptResponseGetPayload<{
  select: typeof promptResponseListSelect;
}>;

type PromptResponseDetailRecord = Prisma.PromptResponseGetPayload<{
  select: typeof promptResponseDetailSelect;
}>;

function someTopicIn(ids?: string[]) {
  return ids?.length ? { some: { topicId: { in: ids } } } : undefined;
}

function someTagIn(ids?: string[]) {
  return ids?.length ? { some: { tagId: { in: ids } } } : undefined;
}

function mapPromptResponse(record: PromptResponseListRecord) {
  const prompt = record.promptRun.prompt;
  const businessBrand = prompt.business.brandKit?.brands[0];
  if (!businessBrand) {
    throw new Error("Prompt business is missing its BUSINESS brand");
  }
  const mainDomain = toRootDomain(businessBrand.domain);
  const { sentiment, position } = calculatePromptMetrics([record], mainDomain);

  const sources = Array.from(
    new Set(record.citations.map((citation) => citation.domain)),
  ).map((domain) => ({ domain }));

  return {
    id: record.id,
    engine: record.engine,
    webSearch: record.webSearch,
    createdAt: record.createdAt,
    promptText: prompt.text,
    text: record.text?.slice(0, RESPONSE_PREVIEW_LENGTH) ?? null,
    metrics: { sentiment, position },
    mentions: record.mentions.map(({ name, domain }) => ({ name, domain })),
    sources,
  };
}

function mapPromptResponseDetail(record: PromptResponseDetailRecord) {
  const prompt = record.promptRun.prompt;
  const businessBrand = prompt.business.brandKit?.brands[0];
  if (!businessBrand) {
    throw new Error("Prompt business is missing its BUSINESS brand");
  }
  const mainDomain = toRootDomain(businessBrand.domain);
  const { sentiment, position } = calculatePromptMetrics([record], mainDomain);
  const brandSentiment = sentimentByBrandId(record.sentimentClaims);

  return {
    id: record.id,
    engine: record.engine,
    text: record.text,
    webSearch: record.webSearch,
    createdAt: record.createdAt,
    promptText: prompt.text,
    metrics: { sentiment, position },
    mentions: record.mentions.map(({ id, name, domain, brandId, brand }) => ({
      id,
      name: brand.name,
      domain,
      sentiment: brandSentiment.get(brandId) ?? null,
      aliases: [...new Set([name, ...brand.aliases])],
      kind: brand.kind,
    })),
    fanOutQueries: record.fanOutQueries,
    sources: record.citations.map(({ id, url, domain, title }) => ({
      id,
      url,
      domain,
      title,
    })),
  };
}

@Injectable()
export class PromptResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPromptResponses(
    businessId: string,
    query: ListPromptResponsesQueryDto,
  ) {
    const { page, limit, skip, take } = toPageWindow(query);
    const where: Prisma.PromptResponseWhereInput = {
      status: PromptResponseStatus.SUCCESS,
      promptRun: {
        prompt: {
          businessId,
          id: query.promptIds?.length ? { in: query.promptIds } : undefined,
          promptTopics: someTopicIn(query.topicIds),
          promptTags: someTagIn(query.tagIds),
        },
      },
      engine: query.engines?.length ? { in: query.engines } : undefined,
      webSearch: query.webSearch,
    };

    const [totalItems, records] = await this.prisma.$transaction([
      this.prisma.promptResponse.count({ where }),
      this.prisma.promptResponse.findMany({
        where,
        select: promptResponseListSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
    ]);

    return {
      items: records.map(mapPromptResponse),
      pageInfo: toPageInfo(page, limit, totalItems),
    };
  }

  async getPromptResponse(businessId: string, responseId: string) {
    const record = await this.prisma.promptResponse.findFirst({
      where: {
        id: responseId,
        status: PromptResponseStatus.SUCCESS,
        promptRun: { prompt: { businessId } },
      },
      select: promptResponseDetailSelect,
    });

    if (!record) {
      throw new NotFoundException("Prompt response not found");
    }

    return mapPromptResponseDetail(record);
  }
}
