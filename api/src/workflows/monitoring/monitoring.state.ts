import { Annotation } from "@langchain/langgraph";
import type {
  EngineFailure,
  EngineResponse,
  PromptMetricState,
} from "./monitoring.types";

export const StateAnnotation = Annotation.Root({
  businessId: Annotation<string>(),
  prompts: Annotation<{ id: string; text: string }[]>(),
  competitors: Annotation<{ id: string; domain: string; name: string }[]>(),
  profile: Annotation<{
    name: string;
    category: string;
    description: string;
    icp: string;
    domain: string;
  }>,
  date: Annotation<Date>,
  rawEngineResponses: Annotation<EngineResponse[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  engineResponses: Annotation<EngineResponse[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  engineFailures: Annotation<EngineFailure[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  promptMetrics: Annotation<PromptMetricState[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
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
