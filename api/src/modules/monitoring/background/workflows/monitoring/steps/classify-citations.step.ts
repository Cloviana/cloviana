import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import { Logger } from "@nestjs/common";
import {
  type CitationDomainType,
  type CitationUrlType,
  Prisma,
} from "@prisma/client";
import { z } from "zod";
import type {
  MonitoringCitation,
  MonitoringCitationClassification,
  MonitoringEngineResponse,
  SerializedMonitoringRunInput,
} from "../monitoring.types";

const CITATION_CLASSIFICATION_MODEL = "openai/gpt-oss-120b";
const CLASSIFICATION_BATCH_SIZE = 20;
const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);
const logger = new Logger("ClassifyCitationsStep");
const DETERMINISTIC_DOMAIN_TYPES = new Map<string, CitationDomainType>([
  ["reddit.com", "UGC"],
  ["youtube.com", "UGC"],
  ["youtu.be", "UGC"],
  ["linkedin.com", "UGC"],
  ["facebook.com", "UGC"],
  ["instagram.com", "UGC"],
  ["quora.com", "UGC"],
  ["medium.com", "UGC"],
  ["github.com", "UGC"],
  ["stackoverflow.com", "UGC"],
  ["stackexchange.com", "UGC"],
  ["g2.com", "UGC"],
  ["yelp.com", "UGC"],
  ["capterra.com", "UGC"],
  ["trustradius.com", "UGC"],
  ["softwareadvice.com", "UGC"],
  ["getapp.com", "UGC"],
  ["wikipedia.org", "REFERENCE"],
  ["fandom.com", "REFERENCE"],
  ["imdb.com", "REFERENCE"],
  ["nih.gov", "INSTITUTIONAL"],
  ["irs.gov", "INSTITUTIONAL"],
  ["forbes.com", "EDITORIAL"],
  ["reuters.com", "EDITORIAL"],
  ["techradar.com", "EDITORIAL"],
  ["google.com", "CORPORATE"],
  ["microsoft.com", "CORPORATE"],
  ["apple.com", "CORPORATE"],
]);

const CitationClassificationSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      urlType: z
        .enum([
          "COMPARISON",
          "OTHER",
          "ARTICLE",
          "HOW_TO_GUIDE",
          "PRODUCT_PAGE",
          "DISCUSSION",
          "LISTICLE",
          "VIDEO",
          "PROFILE",
          "HOMEPAGE",
        ])
        .nullable(),
      domainType: z
        .enum([
          "CORPORATE",
          "UGC",
          "OTHER",
          "REFERENCE",
          "INSTITUTIONAL",
          "EDITORIAL",
        ])
        .nullable(),
    }),
  ),
});

type ClassificationCandidate = {
  id: string;
  citation: MonitoringCitation;
  classification: MonitoringCitationClassification;
};

type CachedUrlClassification = {
  canonicalUrl: string;
  urlType: CitationUrlType;
};

type CachedDomainClassification = {
  domain: string;
  domainType: CitationDomainType;
};

function classifyDeterministically(
  citation: MonitoringCitation,
  competitorDomains: Set<string>,
): MonitoringCitationClassification {
  try {
    const parsedUrl = new URL(citation.url);
    const rootDomain = normalizeDomain(parsedUrl.hostname);
    const pathname = parsedUrl.pathname.replace(/\/{2,}/g, "/");

    let urlType: CitationUrlType | null = pathname === "/" ? "HOMEPAGE" : null;
    let domainType: CitationDomainType | null = null;

    if (rootDomain && competitorDomains.has(rootDomain)) {
      domainType = "COMPETITOR";
    } else if (rootDomain) {
      domainType = DETERMINISTIC_DOMAIN_TYPES.get(rootDomain) ?? null;
    }

    if (
      rootDomain === "reddit.com" &&
      /^\/r\/[^/]+\/comments(?:\/|$)/i.test(pathname)
    ) {
      urlType = "DISCUSSION";
    } else if (
      (rootDomain === "stackoverflow.com" ||
        rootDomain === "stackexchange.com") &&
      /^\/questions(?:\/|$)/i.test(pathname)
    ) {
      urlType = "DISCUSSION";
    } else if (
      rootDomain === "linkedin.com" &&
      /^\/(?:in|company)\/[^/]+/i.test(pathname)
    ) {
      urlType = "PROFILE";
    } else if (
      rootDomain === "github.com" &&
      /^\/[^/]+\/[^/]+\/(?:issues|discussions)(?:\/|$)/i.test(pathname)
    ) {
      urlType = "DISCUSSION";
    } else if (
      rootDomain === "youtube.com" &&
      ((pathname === "/watch" && parsedUrl.searchParams.has("v")) ||
        /^\/(?:shorts|live|embed)\/[^/]+/i.test(pathname))
    ) {
      urlType = "VIDEO";
    } else if (rootDomain === "youtu.be" && pathname !== "/") {
      urlType = "VIDEO";
    }

    return { urlType, domainType };
  } catch {
    return { urlType: null, domainType: null };
  }
}

function uniqueCitations(
  responses: MonitoringEngineResponse[],
): MonitoringCitation[] {
  const citationByUrl = new Map<string, MonitoringCitation>();

  for (const citation of responses.flatMap((response) => response.citations)) {
    const existing = citationByUrl.get(citation.canonicalUrl);
    if (!existing || citation.excerpt.length > existing.excerpt.length) {
      citationByUrl.set(citation.canonicalUrl, citation);
    }
  }

  return [...citationByUrl.values()];
}

async function loadCachedClassifications(
  prisma: PrismaService,
  citations: MonitoringCitation[],
) {
  const canonicalUrls = citations.map((citation) => citation.canonicalUrl);
  const domains = [
    ...new Set(
      citations.flatMap((citation) => {
        const domain = normalizeHostname(citation.canonicalUrl);
        return domain ? [domain] : [];
      }),
    ),
  ];
  const [urlClassifications, domainClassifications] = await Promise.all([
    prisma.$queryRaw<CachedUrlClassification[]>(Prisma.sql`
      SELECT DISTINCT ON ("canonicalUrl")
        "canonicalUrl",
        "urlType"
      FROM "citations"
      WHERE "canonicalUrl" IN (${Prisma.join(canonicalUrls)})
        AND "urlType" IS NOT NULL
      ORDER BY "canonicalUrl", "createdAt" DESC
    `),
    domains.length > 0
      ? prisma.$queryRaw<CachedDomainClassification[]>(Prisma.sql`
          SELECT DISTINCT ON ("domain")
            "domain",
            "domainType"
          FROM "citations"
          WHERE "domain" IN (${Prisma.join(domains)})
            AND "domainType" IS NOT NULL
            AND "domainType" <> 'COMPETITOR'
          ORDER BY "domain", "createdAt" DESC
        `)
      : Promise.resolve([]),
  ]);

  return {
    urlTypes: new Map(
      urlClassifications.map(({ canonicalUrl, urlType }) => [
        canonicalUrl,
        urlType,
      ]),
    ),
    domainTypes: new Map(
      domainClassifications.map(({ domain, domainType }) => [
        domain,
        domainType,
      ]),
    ),
  };
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export async function classifyCitationsStep(
  prisma: PrismaService,
  groq: GroqService,
  input: SerializedMonitoringRunInput,
  responses: MonitoringEngineResponse[],
): Promise<Record<string, MonitoringCitationClassification>> {
  const competitorDomains = new Set(
    input.brands
      .filter((brand) => brand.kind === "COMPETITOR")
      .flatMap((brand) => {
        const domain = normalizeDomain(brand.domain);
        return domain ? [domain] : [];
      }),
  );
  const citations = uniqueCitations(responses);
  if (citations.length === 0) {
    return {};
  }

  const cached = await loadCachedClassifications(prisma, citations);
  const candidates: ClassificationCandidate[] = citations.map(
    (citation, index) => {
      const domain = normalizeHostname(citation.canonicalUrl);
      const deterministic = classifyDeterministically(
        citation,
        competitorDomains,
      );

      return {
        id: `citation-${index + 1}`,
        citation,
        classification: {
          urlType:
            citation.urlType ??
            deterministic.urlType ??
            cached.urlTypes.get(citation.canonicalUrl) ??
            null,
          domainType:
            deterministic.domainType ??
            citation.domainType ??
            (domain ? cached.domainTypes.get(domain) : undefined) ??
            null,
        },
      };
    },
  );

  const classificationsByCanonicalUrl: Record<
    string,
    MonitoringCitationClassification
  > = Object.fromEntries(
    candidates.map(({ citation, classification }) => [
      citation.canonicalUrl,
      classification,
    ]),
  );
  const unresolvedCandidates = candidates.filter(
    ({ classification }) =>
      classification.urlType === null || classification.domainType === null,
  );
  if (unresolvedCandidates.length === 0) {
    return classificationsByCanonicalUrl;
  }

  const systemPrompt = await loadPromptHbs(
    "classify-citations",
    {},
    { baseDir: PROMPT_DIRECTORY },
  );
  await Promise.all(
    chunks(unresolvedCandidates, CLASSIFICATION_BATCH_SIZE).map(
      async (batch) => {
        try {
          const result = await groq.parse({
            name: "classify-monitoring-citations",
            schema: CitationClassificationSchema,
            model: CITATION_CLASSIFICATION_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: JSON.stringify({
                  items: batch.map(({ id, citation, classification }) => ({
                    id,
                    url: citation.url,
                    title: citation.title,
                    excerpt: citation.excerpt,
                    classifyUrlType: classification.urlType === null,
                    classifyDomainType: classification.domainType === null,
                  })),
                }),
              },
            ],
          });
          const candidateById = new Map(
            batch.map((candidate) => [candidate.id, candidate]),
          );

          for (const classified of result.items) {
            const candidate = candidateById.get(classified.id);
            if (!candidate) {
              continue;
            }

            classificationsByCanonicalUrl[candidate.citation.canonicalUrl] = {
              urlType: candidate.classification.urlType ?? classified.urlType,
              domainType:
                candidate.classification.domainType ?? classified.domainType,
            };
          }
        } catch (error) {
          logger.warn(
            `[${input.businessId}] Citation classification failed for ${batch.length} citations: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
    ),
  );

  return classificationsByCanonicalUrl;
}
