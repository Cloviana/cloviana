import { Annotation } from "@langchain/langgraph";
import {
  Competitor,
  ContentIdea,
  DomainMetrics,
  EngineResult,
  ProductContext,
  SentimentResult,
} from "./audit.types";

export const StateAnnotation = Annotation.Root({
  _auditId: Annotation<string>(),
  _email: Annotation<string>(),
  _domain: Annotation<string>(),
  _country: Annotation<string>(),
  _brandName: Annotation<string>(),
  _prompts: Annotation<string[]>(),
  _engineResults: Annotation<EngineResult[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  _enrichedResults: Annotation<EngineResult[]>(),
  _product: Annotation<ProductContext>(),
  _competitors: Annotation<Competitor[]>(),
  _domainMetrics: Annotation<DomainMetrics[]>(),
  _contentIdeas: Annotation<ContentIdea[]>(),
  _sentimentResult: Annotation<SentimentResult>(),
});
