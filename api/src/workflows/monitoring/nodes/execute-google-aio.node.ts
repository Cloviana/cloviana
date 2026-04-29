import { extractMentions } from "@/common/visibility/extract-mentions";
import { AiOverviewItem } from "@/integrations/dataforseo/dataforseo.types";
import { extractFanOutQueries } from "@/workflows/monitoring/utils/extract-fan-out-queries";
import pLimit from "p-limit";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import {
  DEFAULT_GOOGLE_US_LOCATION_CODE,
  RESPONSES_PER_PROMPT_PER_ENGINE,
} from "../monitoring.constants";
import { EngineResponse, StateType } from "../monitoring.state";
import type { EngineFailure } from "../monitoring.types";

const CONCURRENCY = 5;

export async function executeGoogleAio(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  engineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { dataForSeo, groq, logger } = requireMonitoringDependencies(config);
  const limit = pLimit(CONCURRENCY);
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;
  const brands = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors,
  ];

  const results = await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from({ length: RESPONSES_PER_PROMPT_PER_ENGINE }, () =>
        limit(async (): Promise<EngineResponse | EngineFailure> => {
          try {
            const response = await dataForSeo.getGoogleSerpAiOverview({
              keyword: prompt.text,
              language_code: "en",
              location_code: DEFAULT_GOOGLE_US_LOCATION_CODE,
            });

            const taskResult = response.tasks?.[0]?.result?.[0];
            const aiOverview = taskResult?.items?.find(
              (item): item is AiOverviewItem => item.type === "ai_overview",
            );

            if (!aiOverview) {
              logger?.warn(
                `Monitoring Google AIO returned no overview promptId=${prompt.promptId}`,
              );
            }

            const content = aiOverview?.markdown ?? "";
            const citations = (aiOverview?.references ?? [])
              .filter((reference) => Boolean(reference.url))
              .map((reference) => ({
                url: reference.url,
                title: reference.title ?? "",
              }));
            const mentionDomains = await extractMentions(groq, content, brands);
            const mentions = mentionDomains.map((domain) => ({ domain }));

            return {
              engine: "google-aio",
              promptId: prompt.promptId,
              content,
              citations,
              mentions,
              fanOutQueries: extractFanOutQueries(taskResult),
              raw: response,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger?.error(
              `Monitoring Google AIO request failed promptId=${prompt.promptId}: ${message}`,
            );
            return {
              engine: "google-aio",
              promptId: prompt.promptId,
              error: message,
            };
          }
        }),
      ),
    ),
  );
  const engineResponses = results.filter(
    (result): result is EngineResponse => "content" in result,
  );
  const engineFailures = results.filter(
    (result): result is EngineFailure => "error" in result,
  );

  const emptyCount = engineResponses.filter(
    (response) => !response.content,
  ).length;
  logger?.log(
    `Monitoring Google AIO batch completed requested=${requestedCount} succeeded=${engineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { engineResponses, engineFailures };
}
