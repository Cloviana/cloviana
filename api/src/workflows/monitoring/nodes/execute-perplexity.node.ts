import { getTitle } from "@/common/utils/get-title.util";
import { extractMentions } from "@/common/visibility/extract-mentions";
import pLimit from "p-limit";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
import { EngineResponse, StateType } from "../monitoring.state";
import type { EngineFailure } from "../monitoring.types";

export async function executePerplexity(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  engineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { perplexity, groq, logger } = requireMonitoringDependencies(config);
  const limit = pLimit(3);
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;
  const brands = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors,
  ];

  const results: EngineResponse[] = [];
  const failures: EngineFailure[] = [];

  logger?.debug(
    `[${state.businessId}] Monitoring Perplexity batch starting promptCount=${state.prompts.length} requested=${requestedCount}`,
  );

  await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from({ length: RESPONSES_PER_PROMPT_PER_ENGINE }, () =>
        limit(async () => {
          try {
            const result = await perplexity.create({
              model: "sonar",
              reasoning_effort: "medium",
              temperature: 0,
              messages: [{ role: "user", content: prompt.text }],
              web_search_options: {
                user_location: {
                  country: "US",
                },
              },
            });
            const citations = await Promise.all(
              result.citations.map(async (url) => ({
                url,
                title: await getTitle(url),
              })),
            );
            const mentionDomains = await extractMentions(
              groq,
              result.content,
              brands,
            );
            const mentions = mentionDomains.map((domain) => ({ domain }));
            const fanOutQueries = (
              result.raw.choices[0]?.message.reasoning_steps ?? []
            ).flatMap((step) => step.web_search?.search_keywords ?? []);

            results.push({
              engine: "perplexity",
              promptId: prompt.id,
              content: result.content,
              citations,
              mentions,
              fanOutQueries,
              raw: result.raw,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger?.error(
              `[${state.businessId}] Monitoring Perplexity request failed promptId=${prompt.id}: ${message}`,
            );
            failures.push({
              engine: "perplexity",
              promptId: prompt.id,
              error: message,
            });
          }
        }),
      ),
    ),
  );

  logger?.log(
    `[${state.businessId}] Monitoring Perplexity batch completed requested=${requestedCount} succeeded=${results.length} failed=${failures.length}`,
  );

  return { engineResponses: results, engineFailures: failures };
}
