import { ClaudeLlmResponseTask } from "@/integrations/dataforseo/dataforseo.types";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
import { EngineResponse, StateType } from "../monitoring.state";
import type { EngineFailure } from "../monitoring.types";
import { extractLlmResponseContent } from "../utils/extract-llm-response-content";

export async function executeClaude(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{
  rawEngineResponses: EngineResponse[];
  engineFailures: EngineFailure[];
}> {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);
  const requestedCount = state.prompts.length * RESPONSES_PER_PROMPT_PER_ENGINE;

  logger?.debug(
    `[${state.businessId}] Monitoring Claude batch starting promptCount=${state.prompts.length} requested=${requestedCount}`,
  );

  const results = await Promise.all(
    state.prompts.flatMap((prompt) =>
      Array.from(
        { length: RESPONSES_PER_PROMPT_PER_ENGINE },
        async (): Promise<EngineResponse | EngineFailure> => {
          try {
            const task: ClaudeLlmResponseTask = {
              user_prompt: prompt.text,
              model_name: "claude-sonnet-4-6",
              max_output_tokens: 4096,
              web_search: true,
              force_web_search: true,
            };
            const response = await dataForSeo.getClaudeLlmResponse(task);
            const result = response.tasks?.[0]?.result?.[0];
            if (!result) {
              throw new Error(
                response.tasks?.[0]?.status_message ??
                  "Claude response returned no result",
              );
            }

            const { content, citations } = extractLlmResponseContent(
              result.items,
            );

            if (!content) {
              logger?.warn(
                `[${state.businessId}] Monitoring Claude returned empty content promptId=${prompt.id}`,
              );
            }

            return {
              engine: "claude",
              promptId: prompt.id,
              content,
              citations,
              mentions: [],
              fanOutQueries: result.fan_out_queries ?? [],
              raw: result,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger?.error(
              `[${state.businessId}] Monitoring Claude request failed promptId=${prompt.id}: ${message}`,
            );
            return { engine: "claude", promptId: prompt.id, error: message };
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
    `[${state.businessId}] Monitoring Claude batch completed requested=${requestedCount} succeeded=${rawEngineResponses.length} failed=${engineFailures.length} empty=${emptyCount}`,
  );

  return { rawEngineResponses, engineFailures };
}
