import {
  AiOverviewItem,
  GoogleOrganicTask,
} from "@/integrations/dataforseo/dataforseo.types";
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

export async function executeGoogleAio(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  rawEngineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;

  logger?.debug(
    `[${state.businessId}] Monitoring Google AIO batch starting promptCount=${state.prompts.length} requested=${requestedCount}`,
  );

  const results = await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from(
        { length: RESPONSES_PER_PROMPT_PER_ENGINE },
        async (): Promise<EngineResponse | EngineFailure> => {
          try {
            const task: GoogleOrganicTask = {
              keyword: prompt.text,
              language_code: "en",
              location_code: DEFAULT_GOOGLE_US_LOCATION_CODE,
              load_async_ai_overview: true,
            };
            const response = await dataForSeo.getGoogleSerpAiOverview(task);
            const result = response.tasks?.[0]?.result?.[0];

            if (!result) {
              throw new Error(
                response.tasks?.[0]?.status_message ??
                  "Google AIO response returned no result",
              );
            }

            const aiOverview = result.items?.find(
              (item): item is AiOverviewItem => item.type === "ai_overview",
            );

            if (!aiOverview) {
              logger?.warn(
                `[${state.businessId}] Monitoring Google AIO returned no overview promptId=${prompt.id}`,
              );
            }

            const content = aiOverview?.markdown ?? "";
            const citations = (aiOverview?.references ?? [])
              .filter((reference) => Boolean(reference.url))
              .map((reference) => ({
                url: reference.url,
                title: reference.title ?? "",
              }));

            return {
              engine: "google-aio",
              promptId: prompt.id,
              content,
              citations,
              mentions: [],
              // Google's SERP schema has no fan_out_queries field (that's an
              // LLM-provider concept, not exposed for organic/AI overview).
              fanOutQueries: [],
              raw: result,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger?.error(
              `[${state.businessId}] Monitoring Google AIO request failed promptId=${prompt.id}: ${message}`,
            );
            return {
              engine: "google-aio",
              promptId: prompt.id,
              error: message,
            };
          }
        },
      ),
    ),
  );

  const rawEngineResponses = results.filter(
    (result): result is EngineResponse => "content" in result,
  );
  const engineFailures = results.filter(
    (result): result is EngineFailure => "error" in result,
  );
  const emptyCount = rawEngineResponses.filter(
    (response) => !response.content,
  ).length;

  logger?.log(
    `[${state.businessId}] Monitoring Google AIO batch completed requested=${requestedCount} succeeded=${rawEngineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { rawEngineResponses, engineFailures };
}
