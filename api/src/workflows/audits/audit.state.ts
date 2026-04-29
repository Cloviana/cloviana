import { Annotation } from "@langchain/langgraph";
import {
  BusinessProfile,
  Competitor,
  ContentIdea,
  EngineResult,
  SentimentResult,
} from "./audit.types";

export const StateAnnotation = Annotation.Root({
  auditId: Annotation<string>(),
  email: Annotation<string>(),
  country: Annotation<string>(),
  profile: Annotation<BusinessProfile>(),
  competitors: Annotation<Competitor[]>(),
  prompts: Annotation<{ promptId: string; text: string }[]>(),
  engineResponses: Annotation<EngineResult[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  contentIdeas: Annotation<ContentIdea[]>(),
  sentimentResult: Annotation<SentimentResult>(),
});

export type StateType = typeof StateAnnotation.State;
