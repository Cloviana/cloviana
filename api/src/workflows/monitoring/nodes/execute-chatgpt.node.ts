// Graph node: asks ChatGPT (via DataForSEO's scrape task) each active
// prompt, forcing a live web search so responses include citations.
import type { ChatGptScrapeTask } from "@/integrations/dataforseo/dataforseo.types";
import {
  type MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.context";
import {
  DEFAULT_GOOGLE_US_LOCATION_CODE,
  MONITORING_LANGUAGE_CODE,
} from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import { extractResponseContent } from "../engines/extract-response-content";
import {
  executeEngineBatch,
  nativeFanOutQueries,
  requireFirstResult,
} from "../engines/execute-engine-batch";

export async function executeChatgpt(
  state: MonitoringState,
  config: MonitoringNodeConfig,
) {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);

  return executeEngineBatch(state, {
    engine: "chatgpt",
    displayName: "ChatGPT",
    logger,
    execute: async (prompt) => {
      const task: ChatGptScrapeTask = {
        keyword: prompt.text,
        language_code: MONITORING_LANGUAGE_CODE,
        location_code: DEFAULT_GOOGLE_US_LOCATION_CODE,
        force_web_search: true,
      };
      const response = await dataForSeo.getChatGptScrape(task);
      const result = requireFirstResult(
        response,
        "ChatGPT response returned no result",
      );
      const { content, citations } = await extractResponseContent(
        result.markdown ?? "",
        (result.sources ?? []).map((source) => ({
          url: source.url,
          title: source.title ?? source.source_name,
          fallbackText: source.snippet,
        })),
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
