import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { canonicalizeUrl } from "@/common/utils/canonicalize-url.util";
import type { AppConfiguration } from "@/config/app.configuration";
import type {
  MonitoringCitation,
  MonitoringEngineResponse,
  SerializedMonitoringRunInput,
} from "@/modules/monitoring/background/workflows/monitoring/monitoring.types";
import { classifyCitationsStep } from "@/modules/monitoring/background/workflows/monitoring/steps/classify-citations.step";
import { toCitation } from "@/modules/monitoring/background/workflows/monitoring/utils/citation.util";
import {
  BrandKind,
  type CitationDomainType,
  type CitationUrlType,
} from "@prisma/client";

const SCRIPT_BATCH_SIZE = 50;

type CitationRow = {
  id: string;
  url: string;
  title: string | null;
  urlType: CitationUrlType | null;
  domainType: CitationDomainType | null;
};

type CitationGroup = {
  ids: string[];
  url: string;
  canonicalUrl: string;
  title: string | null;
  urlType: CitationUrlType | null;
  domainType: CitationDomainType | null;
  missingUrlTypeCount: number;
  missingDomainTypeCount: number;
};

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function groupCitations(rows: CitationRow[]): CitationGroup[] {
  const groups = new Map<string, CitationGroup>();

  for (const row of rows) {
    const canonicalUrl = canonicalizeUrl(row.url);
    const existing = groups.get(canonicalUrl);

    if (!existing) {
      groups.set(canonicalUrl, {
        ids: [row.id],
        url: row.url,
        canonicalUrl,
        title: row.title,
        urlType: row.urlType,
        domainType: row.domainType,
        missingUrlTypeCount: row.urlType === null ? 1 : 0,
        missingDomainTypeCount: row.domainType === null ? 1 : 0,
      });
      continue;
    }

    existing.ids.push(row.id);
    existing.missingUrlTypeCount += row.urlType === null ? 1 : 0;
    existing.missingDomainTypeCount += row.domainType === null ? 1 : 0;
    existing.urlType ??= row.urlType;
    existing.domainType ??= row.domainType;
    if ((row.title?.length ?? 0) > (existing.title?.length ?? 0)) {
      existing.title = row.title;
    }
  }

  return [...groups.values()];
}

async function prepareCitation(
  group: CitationGroup,
): Promise<MonitoringCitation> {
  const citation = await toCitation({
    url: group.url,
    title: group.title ?? "",
    excerpt: null,
  });

  return {
    ...citation,
    canonicalUrl: group.canonicalUrl,
    urlType: group.urlType,
    domainType: group.domainType,
  };
}

async function main() {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is required");
  }

  const prisma = new PrismaService();
  const groq = new GroqService({ groqApiKey } as AppConfiguration);
  await prisma.$connect();

  try {
    const businesses = await prisma.business.findMany({
      where: {
        prompts: {
          some: {
            runs: {
              some: {
                responses: {
                  some: {
                    citations: {
                      some: {
                        OR: [{ urlType: null }, { domainType: null }],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      include: {
        brandKit: {
          include: {
            brands: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                kind: true,
                domain: true,
                name: true,
                aliases: true,
              },
            },
          },
        },
      },
    });

    let targetedRows = 0;
    let processedRows = 0;
    let urlTypesFilled = 0;
    let domainTypesFilled = 0;

    console.log(
      `Found ${businesses.length} businesses with unclassified citations.`,
    );

    for (const business of businesses) {
      const brands = business.brandKit?.brands ?? [];
      const businessName =
        brands.find((brand) => brand.kind === BrandKind.BUSINESS)?.name ??
        business.id;
      const rows = await prisma.citation.findMany({
        where: {
          OR: [{ urlType: null }, { domainType: null }],
          promptResponse: {
            promptRun: { prompt: { businessId: business.id } },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          url: true,
          title: true,
          urlType: true,
          domainType: true,
        },
      });
      const groups = groupCitations(rows);
      const batches = chunks(groups, SCRIPT_BATCH_SIZE);
      targetedRows += rows.length;

      console.log(
        `[${businessName}] ${rows.length} rows across ${groups.length} canonical URLs.`,
      );

      const input: SerializedMonitoringRunInput = {
        businessId: business.id,
        dateIso: new Date().toISOString(),
        prompts: [],
        brands,
      };

      for (const [batchIndex, batch] of batches.entries()) {
        const citations = await Promise.all(batch.map(prepareCitation));
        const response: MonitoringEngineResponse = {
          responseKey: `citation-backfill:${business.id}:${batchIndex + 1}`,
          engine: "CHATGPT",
          promptId: "00000000-0000-0000-0000-000000000000",
          content: "",
          webSearch: true,
          citations,
          mentions: [],
          fanOutQueries: [],
          sentimentClaims: [],
        };
        const classifications = await classifyCitationsStep(
          prisma,
          groq,
          input,
          [response],
        );
        const updates: ReturnType<typeof prisma.citation.updateMany>[] = [];

        for (const group of batch) {
          const classification = classifications[group.canonicalUrl];
          updates.push(
            prisma.citation.updateMany({
              where: { id: { in: group.ids } },
              data: { canonicalUrl: group.canonicalUrl },
            }),
          );

          if (classification?.urlType) {
            updates.push(
              prisma.citation.updateMany({
                where: { id: { in: group.ids }, urlType: null },
                data: { urlType: classification.urlType },
              }),
            );
            urlTypesFilled += group.missingUrlTypeCount;
          }

          if (classification?.domainType) {
            updates.push(
              prisma.citation.updateMany({
                where: { id: { in: group.ids }, domainType: null },
                data: { domainType: classification.domainType },
              }),
            );
            domainTypesFilled += group.missingDomainTypeCount;
          }

          processedRows += group.ids.length;
        }

        await prisma.$transaction(updates);
        console.log(
          `[${businessName}] Completed batch ${batchIndex + 1}/${batches.length}.`,
        );
      }
    }

    const remainingRows = await prisma.citation.count({
      where: { OR: [{ urlType: null }, { domainType: null }] },
    });

    console.log(
      `Done. Targeted ${targetedRows} rows, processed ${processedRows}, filled ${urlTypesFilled} URL types and ${domainTypesFilled} domain types. ${remainingRows} rows remain unclassified.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
