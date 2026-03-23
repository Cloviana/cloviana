import { Annotation } from "@langchain/langgraph";
import {
  Competitor,
  ContentIdea,
  DomainMetrics,
  EngineResult,
  ProductContext,
  SelectedUrls,
  SentimentResult,
  Topic,
} from "./audit.types";

export const StateAnnotation = Annotation.Root({
  _auditId: Annotation<string>(),
  _domain: Annotation<string>(),
  _country: Annotation<string>(),
  _brandName: Annotation<string>(),
  _sitemapUrls: Annotation<string[]>(),
  _selectedUrls: Annotation<SelectedUrls>(),
  _topics: Annotation<Topic[]>(),
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
