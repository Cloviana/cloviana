import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { StateAnnotation } from "../audit.state";
import { DomainMetrics, EngineName } from "../audit.types";
import { normalizeDomain } from "../utils/normalize-domain";

const ENGINES: EngineName[] = ["google_aio", "chatgpt", "perplexity"];

export async function calculateMetrics(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const logger = configurable?.logger as Logger;
  logger?.debug(`[calculate-metrics] ${state._engineResults.length} engine results, ${state._competitors.length} competitors`);
  const brands = [
    { domain: normalizeDomain(state._domain) ?? state._domain, name: state._brandName },
    ...state._competitors
      .filter((c) => !!c.domain)
      .map((c) => ({ domain: normalizeDomain(c.domain) ?? c.domain, name: c.title })),
  ];

  const resultsByEngine = new Map<EngineName, typeof state._engineResults>();
  for (const engine of ENGINES) {
    resultsByEngine.set(engine, state._engineResults.filter((r) => r.engine === engine));
  }

  const domainMetrics: DomainMetrics[] = brands.map(({ domain, name }) => {
    const metrics: DomainMetrics = {
      domain,
      name,
      visibility: { google_aio: 0, chatgpt: 0, perplexity: 0, overall: 0 },
      citation: { google_aio: 0, chatgpt: 0, perplexity: 0, overall: 0 },
    };

    for (const engine of ENGINES) {
      const results = resultsByEngine.get(engine)!;
      if (results.length === 0) continue;

      let mentionCount = 0;
      let citationCount = 0;

      for (const r of results) {
        const isMentioned = r.mentions.some(
          (m) => m.domain && (normalizeDomain(m.domain) ?? m.domain) === domain,
        );
        const isCited = r.sources.some(
          (s) => normalizeDomain(s.url) === domain,
        );
        if (isMentioned) mentionCount++;
        if (isCited) citationCount++;
      }

      metrics.visibility[engine] = (mentionCount / results.length) * 100;
      metrics.citation[engine] =
        mentionCount > 0 ? (citationCount / mentionCount) * 100 : 0;
    }

    metrics.visibility.overall =
      (metrics.visibility.google_aio +
        metrics.visibility.chatgpt +
        metrics.visibility.perplexity) /
      3;

    metrics.citation.overall =
      (metrics.citation.google_aio +
        metrics.citation.chatgpt +
        metrics.citation.perplexity) /
      3;

    logger?.debug(
      `[calculate-metrics] ${domain}: visibility=${metrics.visibility.overall.toFixed(1)}% citation=${metrics.citation.overall.toFixed(1)}%`,
    );
    return metrics;
  });

  return { _domainMetrics: domainMetrics };
}
