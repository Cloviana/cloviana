// Graph node: runs after all engines finish. Scans each raw response's text
// for mentions of our business or its competitors (batched into one Groq
// call), independent of citations that already reference the brand's site.
import { batchExtractMentions } from "@/common/visibility/extract-mentions";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.context";
import type { MonitoringState } from "../monitoring.state";
import type { ResponseMentions } from "../monitoring.types";

export async function extractMentionsNode(
  state: MonitoringState,
  config: MonitoringNodeConfig,
): Promise<{ responseMentions: ResponseMentions[] }> {
  const { groq, logger } = requireMonitoringDependencies(config);

  if (state.rawEngineResponses.length === 0) {
    return { responseMentions: [] };
  }

  const brands = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors,
  ];

  const items = state.rawEngineResponses.map((response) => ({
    customId: response.responseKey,
    text: response.content,
  }));

  logger?.debug(
    `[${state.businessId}] Extracting mentions via Groq batch total=${items.length}`,
  );

  const mentionResults = await batchExtractMentions(groq, items, brands);
  const responseMentions = mentionResults.map((result) => ({
    responseKey: result.customId,
    mentions: result.domains.map((domain) => ({ domain })),
  }));

  logger?.log(
    `[${state.businessId}] Mention extraction completed responses=${responseMentions.length}`,
  );

  return { responseMentions };
}
