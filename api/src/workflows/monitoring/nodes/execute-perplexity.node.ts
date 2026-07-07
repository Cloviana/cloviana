// Graph node: asks Perplexity (via DataForSEO's LLM response task) each
// active prompt. Perplexity always web-searches, so no force flag needed.
import type { PerplexityLlmResponseTask } from "@/integrations/dataforseo/dataforseo.types";
import {
  type MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.context";
import {
  MAX_ENGINE_OUTPUT_TOKENS,
  PERPLEXITY_MODEL,
} from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import { extractLlmResponseContent } from "../engines/extract-response-content";
import {
  executeEngineBatch,
  nativeFanOutQueries,
  requireFirstResult,
} from "../engines/execute-engine-batch";

export async function executePerplexity(
  state: MonitoringState,
  config: MonitoringNodeConfig,
) {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);

  return executeEngineBatch(state, {
    engine: "perplexity",
    displayName: "Perplexity",
    logger,
    execute: async (prompt) => {
      const task: PerplexityLlmResponseTask = {
        user_prompt: prompt.text,
        model_name: PERPLEXITY_MODEL,
        max_output_tokens: MAX_ENGINE_OUTPUT_TOKENS,
        temperature: 0,
      };
      const response = await dataForSeo.getPerplexityLlmResponse(task);
      const result = requireFirstResult(
        response,
        "Perplexity response returned no result",
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
