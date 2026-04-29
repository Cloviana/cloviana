import { Annotation } from "@langchain/langgraph";
import type {
  EngineFailure,
  EngineResponse,
  PromptMetricState,
} from "./monitoring.types";

export const StateAnnotation = Annotation.Root({
  prompts: Annotation<{ promptId: string; text: string }[]>,
  competitors: Annotation<{ id: string; domain: string; name: string }[]>,
  profile: Annotation<{
    businessId: string;
    name: string;
    category: string;
    description: string;
    icp: string;
    domain: string;
  }>,
  date: Annotation<Date>,
  engineResponses: Annotation<EngineResponse[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  engineFailures: Annotation<EngineFailure[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  promptMetrics: Annotation<PromptMetricState[]>,
});

export type StateType = typeof StateAnnotation.State;
export type {
  BusinessMetricState,
  Citation,
  EngineFailure,
  EngineResponse,
  Mention,
  PromptMetricState,
} from "./monitoring.types";
