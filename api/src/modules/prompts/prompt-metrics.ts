import { toRootDomain } from "@/common/utils/normalize-domain.util";
import { computeRate } from "@/common/visibility/visibility-metric-calculator";
import type { ClaimSentiment } from "@prisma/client";

export type PromptMetricResponse = {
  webSearch: boolean;
  mentions: Array<{ domain: string; order: number }>;
  citations: Array<{ domain: string }>;
  sentimentClaims: Array<{
    sentiment: ClaimSentiment;
    brand: { domain: string } | null;
  }>;
};

const EMPTY_METRICS = {
  visibility: null,
  citationShare: null,
  sentiment: null,
  position: null,
  sov: null,
  webSearch: null,
} as const;

/** Rolls responses up into the business's headline prompt metrics. */
export function calculatePromptMetrics(
  responses: PromptMetricResponse[],
  mainDomain: string,
) {
  if (responses.length === 0) {
    return { ...EMPTY_METRICS };
  }

  let mentionedResponseCount = 0;
  let citedResponseCount = 0;
  let webSearchResponseCount = 0;
  let businessMentionCount = 0;
  let trackedMentionCount = 0;
  let positionTotal = 0;
  let positionCount = 0;
  let positiveClaimCount = 0;
  let negativeClaimCount = 0;

  for (const response of responses) {
    const businessMentions = response.mentions.filter(
      (mention) => toRootDomain(mention.domain) === mainDomain,
    );

    if (businessMentions.length > 0) {
      mentionedResponseCount += 1;
    }
    for (const mention of businessMentions) {
      positionTotal += mention.order;
      positionCount += 1;
    }

    if (
      response.citations.some(
        (citation) => toRootDomain(citation.domain) === mainDomain,
      )
    ) {
      citedResponseCount += 1;
    }
    if (response.webSearch) {
      webSearchResponseCount += 1;
    }

    businessMentionCount += businessMentions.length;
    trackedMentionCount += response.mentions.length;

    for (const claim of response.sentimentClaims) {
      if (!claim.brand || toRootDomain(claim.brand.domain) !== mainDomain) {
        continue;
      }
      if (claim.sentiment === "POSITIVE") {
        positiveClaimCount += 1;
      }
      if (claim.sentiment === "NEGATIVE") {
        negativeClaimCount += 1;
      }
    }
  }

  const sentimentClaimCount = positiveClaimCount + negativeClaimCount;

  return {
    visibility: computeRate(mentionedResponseCount, responses.length),
    citationShare: computeRate(citedResponseCount, responses.length),
    sentiment:
      sentimentClaimCount > 0
        ? computeRate(positiveClaimCount, sentimentClaimCount)
        : null,
    position: positionCount > 0 ? positionTotal / positionCount : null,
    sov: computeRate(businessMentionCount, trackedMentionCount),
    webSearch: computeRate(webSearchResponseCount, responses.length),
  };
}

/** Share of each brand's claims in one answer that are positive. */
export function sentimentByBrandId(
  claims: Array<{ brandId: string | null; sentiment: ClaimSentiment }>,
): Map<string, number> {
  const totals = new Map<string, { positive: number; total: number }>();

  for (const claim of claims) {
    if (claim.brandId === null) {
      continue;
    }

    const total = totals.get(claim.brandId) ?? { positive: 0, total: 0 };
    if (claim.sentiment === "POSITIVE") {
      total.positive += 1;
    }
    total.total += 1;
    totals.set(claim.brandId, total);
  }

  return new Map(
    [...totals].map(([brandId, { positive, total }]) => [
      brandId,
      computeRate(positive, total),
    ]),
  );
}
