// Shared state threaded through the LangGraph nodes. Fields with a
// `reducer` are appended to as parallel engine/analysis nodes complete;
// fields with a plain `value` are overwritten wholesale by one node.
import { Annotation } from "@langchain/langgraph";
import type {
  EngineFailure,
  EngineResponse,
  MonitoringCompetitor,
  MonitoringProfile,
  MonitoringPrompt,
  PromptMetricState,
  ResponseFanOutInference,
  ResponseMentions,
} from "./monitoring.types";

export const MonitoringStateAnnotation = Annotation.Root({
  businessId: Annotation<string>(),
  prompts: Annotation<MonitoringPrompt[]>(),
  competitors: Annotation<MonitoringCompetitor[]>(),
  profile: Annotation<MonitoringProfile>(),
  date: Annotation<Date>,
  rawEngineResponses: Annotation<EngineResponse[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  responseMentions: Annotation<ResponseMentions[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  fanOutInferences: Annotation<ResponseFanOutInference[]>({
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

export type MonitoringState = typeof MonitoringStateAnnotation.State;
