// Graph node: runs a Google search per active prompt and pulls out the AI
// Overview box, if Google served one. No native fan-out queries here —
// unlike the LLM engines, Google doesn't expose its own search trail.
import type {
  AiOverviewItem,
  GoogleOrganicTask,
} from "@/integrations/dataforseo/dataforseo.types";
import {
  type MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.context";
import {
  DEFAULT_GOOGLE_US_LOCATION_CODE,
  MONITORING_LANGUAGE_CODE,
} from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import { extractAiOverviewContent } from "../engines/extract-response-content";
import { executeEngineBatch, requireFirstResult } from "../engines/execute-engine-batch";

export async function executeGoogleAio(
  state: MonitoringState,
  config: MonitoringNodeConfig,
) {
  const { dataForSeo, logger } = requireMonitoringDependencies(config);

  return executeEngineBatch(state, {
    engine: "google-aio",
    displayName: "Google AI Overview",
    logger,
    execute: async (prompt) => {
      const task: GoogleOrganicTask = {
        keyword: prompt.text,
        language_code: MONITORING_LANGUAGE_CODE,
        location_code: DEFAULT_GOOGLE_US_LOCATION_CODE,
        load_async_ai_overview: true,
      };
      const response = await dataForSeo.getGoogleSerpAiOverview(task);
      const result = requireFirstResult(
        response,
        "Google AI Overview response returned no result",
      );
      const aiOverview = result.items?.find(
        (item): item is AiOverviewItem => item.type === "ai_overview",
      );

      if (!aiOverview) {
        logger?.warn(
          `[${state.businessId}] Google AI Overview unavailable promptId=${prompt.id}`,
        );
      }

      const { content, citations } = await extractAiOverviewContent(aiOverview);

      return {
        content,
        citations,
        fanOutQueries: [],
        raw: result,
      };
    },
  });
}
