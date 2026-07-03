import { ChatGptScrapeTask } from "@/integrations/dataforseo/dataforseo.types";
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

export async function executeChatgpt(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  rawEngineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;

  logger?.debug(
    `[${state.businessId}] Monitoring ChatGPT batch starting promptCount=${state.prompts.length} requested=${requestedCount}`,
  );

  const results = await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from(
        { length: RESPONSES_PER_PROMPT_PER_ENGINE },
        async (): Promise<EngineResponse | EngineFailure> => {
          try {
            const task: ChatGptScrapeTask = {
              keyword: prompt.text,
              language_code: "en",
              location_code: DEFAULT_GOOGLE_US_LOCATION_CODE,
              force_web_search: true,
            };
            const response = await dataForSeo.getChatGptScrape(task);
            const result = response.tasks?.[0]?.result?.[0];
            if (!result) {
              throw new Error(
                response.tasks?.[0]?.status_message ??
                  "ChatGPT response returned no result",
              );
            }

            const citations = (result.sources ?? [])
              .filter((source) => Boolean(source.url))
              .map((source) => ({
                url: source.url,
                title: source.title ?? source.source_name ?? "",
              }));

            if (!result.markdown) {
              logger?.warn(
                `[${state.businessId}] Monitoring ChatGPT returned empty content promptId=${prompt.id}`,
              );
            }

            return {
              engine: "chatgpt",
              promptId: prompt.id,
              content: result.markdown ?? "",
              citations,
              mentions: [],
              fanOutQueries: result.fan_out_queries ?? [],
              raw: result,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger?.error(
              `[${state.businessId}] Monitoring ChatGPT request failed promptId=${prompt.id}: ${message}`,
            );
            return { engine: "chatgpt", promptId: prompt.id, error: message };
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
    `[${state.businessId}] Monitoring ChatGPT batch completed requested=${requestedCount} succeeded=${rawEngineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { rawEngineResponses, engineFailures };
}
