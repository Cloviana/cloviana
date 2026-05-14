import { batchExtractMentions } from "@/common/visibility/extract-mentions";
import {
  MonitoringNodeConfig,
  requireMonitoringDependencies,
} from "../monitoring.config";
import { EngineResponse, StateType } from "../monitoring.state";

export async function extractMentionsNode(
  state: StateType,
  config: MonitoringNodeConfig,
): Promise<{ engineResponses: EngineResponse[] }> {
  const { groq, logger } = requireMonitoringDependencies(config);

  const brands = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors,
  ];

  const items = state.rawEngineResponses.map((response, index) => ({
    customId: String(index),
    text: response.content,
  }));

  logger?.debug(
    `[${state.businessId}] Extracting mentions via Groq batch total=${items.length}`,
  );

  const mentionResults = await batchExtractMentions(groq, items, brands);
  const mentionMap = new Map(mentionResults.map((r) => [r.customId, r.domains]));

  const engineResponses = state.rawEngineResponses.map((response, index) => ({
    ...response,
    mentions: (mentionMap.get(String(index)) ?? []).map((domain) => ({
      domain,
    })),
  }));

  logger?.log(
    `[${state.businessId}] Mention extraction completed responses=${engineResponses.length}`,
  );

  return { engineResponses };
}
