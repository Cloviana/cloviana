import { Annotation } from "@langchain/langgraph";
import type {
  BusinessProfile,
  BuyerLanguage,
  Cluster,
  Competitor,
  Doc,
  Prompt,
  PromptUniverse,
} from "./prompt-generation.types";

export const StateAnnotation = Annotation.Root({
  _businessId: Annotation<string>(),
  profile: Annotation<BusinessProfile>(),
  competitors: Annotation<Competitor[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  extraContext: Annotation<string[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  docs: Annotation<Doc[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  buyerLanguage: Annotation<BuyerLanguage[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  clusters: Annotation<Cluster[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  prompts: Annotation<Prompt[]>({
    value: (_current, next) => next,
    default: () => [],
  }),
  promptUniverse: Annotation<PromptUniverse>({
    value: (_current, next) => next,
    default: () => ({ prompts: [], clusters: [] }),
  }),
});

export type StateType = typeof StateAnnotation.State;
