import { extractMentions as extractBrandMentions } from "@/common/visibility/extract-mentions";
import type {
  MonitoringEngineResponse,
  MonitoringMention,
  SerializedMonitoringRunInput,
} from "../monitoring.types";

export function extractMentionsStep(
  input: SerializedMonitoringRunInput,
  responses: MonitoringEngineResponse[],
): Record<string, MonitoringMention[]> {
  return Object.fromEntries(
    responses.map((response) => [
      response.responseKey,
      extractBrandMentions(response.content, input.brands),
    ]),
  );
}
