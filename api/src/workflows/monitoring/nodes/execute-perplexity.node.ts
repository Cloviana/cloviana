import { PerplexityLlmResponseTask } from "@/integrations/dataforseo/dataforseo.types";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
import { EngineResponse, StateType } from "../monitoring.state";
import type { EngineFailure } from "../monitoring.types";
import { extractLlmResponseContent } from "../utils/extract-llm-response-content";

export async function executePerplexity(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  rawEngineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;

  const results: EngineResponse[] = [];
  const failures: EngineFailure[] = [];

  logger?.debug(
    `[${state.businessId}] Monitoring Perplexity batch starting promptCount=${state.prompts.length} requested=${requestedCount}`,
  );

  // ponytail: DataForSEO has no task_post/tasks_ready for Perplexity, live is the only option
  await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from({ length: RESPONSES_PER_PROMPT_PER_ENGINE }, async () => {
        try {
          const task: PerplexityLlmResponseTask = {
            user_prompt: prompt.text,
            model_name: "sonar",
          };
          const response = await dataForSeo.getPerplexityLlmResponse(task);
          const result = response.tasks?.[0]?.result?.[0];

          if (!result) {
            throw new Error(
              response.tasks?.[0]?.status_message ??
                "Perplexity response returned no result",
            );
          }

          const { content, citations } = extractLlmResponseContent(
            result.items,
          );

          if (!content) {
            logger?.warn(
              `[${state.businessId}] Monitoring Perplexity returned empty content promptId=${prompt.id}`,
            );
          }

          results.push({
            engine: "perplexity",
            promptId: prompt.id,
            content,
            citations,
            mentions: [],
            fanOutQueries: result.fan_out_queries ?? [],
            raw: result,
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
  );

  const emptyCount = results.filter((response) => !response.content).length;

  logger?.log(
    `[${state.businessId}] Monitoring Perplexity batch completed requested=${requestedCount} succeeded=${results.length} failed=${failures.length} empty=${emptyCount}`,
  );

  return { rawEngineResponses: results, engineFailures: failures };
}
