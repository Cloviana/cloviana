import { computePromptMetrics } from "../monitoring-metric-calculator";
import type { StateType } from "../monitoring.state";
import type { PromptMetricState } from "../monitoring.types";

export async function computeMetrics(state: StateType): Promise<{
  promptMetrics: PromptMetricState[];
}> {
  const promptMetrics = computePromptMetrics(state, state.engineResponses);

  return { promptMetrics };
}
