// Graph node: asks Claude (via DataForSEO's LLM response task) each active
// prompt, forcing a live web search so responses include citations.
import type { ClaudeLlmResponseTask } from "@/integrations/dataforseo/dataforseo.types";
import {
  type MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.context";
import {
  CLAUDE_MODEL,
  MAX_ENGINE_OUTPUT_TOKENS,
} from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import { extractLlmResponseContent } from "../engines/extract-response-content";
import {
  executeEngineBatch,
  nativeFanOutQueries,
  requireFirstResult,
} from "../engines/execute-engine-batch";

export async function executeClaude(
  state: MonitoringState,
  config: MonitoringNodeConfig,
) {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);

  return executeEngineBatch(state, {
    engine: "claude",
    displayName: "Claude",
    logger,
    execute: async (prompt) => {
      const task: ClaudeLlmResponseTask = {
        user_prompt: prompt.text,
        model_name: CLAUDE_MODEL,
        max_output_tokens: MAX_ENGINE_OUTPUT_TOKENS,
        temperature: 0,
        web_search: true,
        force_web_search: true,
      };
      const response = await dataForSeo.getClaudeLlmResponse(task);
      const result = requireFirstResult(
        response,
        "Claude response returned no result",
      );
      const { content, citations } = await extractLlmResponseContent(
        result.items,
      );

      return {
        content,
        citations,
        fanOutQueries: nativeFanOutQueries(result.fan_out_queries),
        raw: result,
      };
    },
  });
}
