import { normalizeDomain } from "@/common/utils/normalize-domain.util";

const SOV_ALPHA = 0.7;

export type VisibilityMetricResponse = {
  citations: { url: string }[];
  mentions: { domain: string | null }[];
};

export type VisibilityDomainMetrics = {
  mentionRate: number;
  citationShare: number;
  sov: number;
};

export function computeRate(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

export function computeSov(mentionRate: number, citationShare: number): number {
  const citationShareRatio = citationShare / 100;

  // SOV = mentionRate x (alpha + (1 - alpha) x citationShare)
  // B2B SaaS default: SOV = mentionRate x (0.7 + 0.3 x citationShare)
  return Number(
    (mentionRate * (SOV_ALPHA + (1 - SOV_ALPHA) * citationShareRatio)).toFixed(
      6,
    ),
  );
}

function normalizeBrandDomain(domain: string): string {
  return normalizeDomain(domain) ?? domain;
}

export function isDomainMentioned(
  response: VisibilityMetricResponse,
  domain: string,
): boolean {
  const normalizedDomain = normalizeBrandDomain(domain);

  return response.mentions.some(
    (mention) =>
      mention.domain !== null &&
      normalizeBrandDomain(mention.domain) === normalizedDomain,
  );
}

export function isDomainCited(
  response: VisibilityMetricResponse,
  domain: string,
): boolean {
  const normalizedDomain = normalizeBrandDomain(domain);

  return response.citations.some(
    (citation) => normalizeBrandDomain(citation.url) === normalizedDomain,
  );
}

export function computeDomainMetrics(
  domain: string,
  responses: VisibilityMetricResponse[],
): VisibilityDomainMetrics {
  const totalResponses = responses.length;
  const mentionCount = responses.filter((response) =>
    isDomainMentioned(response, domain),
  ).length;
  const citationCount = responses.filter((response) =>
    isDomainCited(response, domain),
  ).length;

  const mentionRate = computeRate(mentionCount, totalResponses);
  const citationShare = computeRate(citationCount, totalResponses);
  const sov = computeSov(mentionRate, citationShare);

  return {
    mentionRate,
    citationShare,
    sov,
  };
}
