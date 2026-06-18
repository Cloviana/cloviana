import { END, START, StateGraph } from "@langchain/langgraph";
import {
  assignBuyerLanguageToClusters,
  collectExternalDocuments,
  createClusterTaxonomy,
  createPromptUniverse,
  deduplicatePrompts,
  extractBuyerLanguage,
  generatePrompts,
  scoreBuyerLanguage,
  scorePrompts,
} from "./nodes";
import {
  PromptGenerationContextAnnotation,
  type PromptGenerationNodeConfig,
} from "./prompt-generation.config";
import { StateAnnotation } from "./prompt-generation.state";

type PromptGenerationNode = (
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
) => Promise<Partial<typeof StateAnnotation.State>>;

const progressSteps = {
  "collect-external-documents": {
    percent: 10,
    title: "Reading public sources",
  },
  "extract-buyer-language": {
    percent: 24,
    title: "Pulling buyer language",
  },
  "score-buyer-language": {
    percent: 38,
    title: "Filtering useful signals",
  },
  "create-cluster-taxonomy": {
    percent: 38,
    title: "Grouping buying topics",
  },
  "assign-buyer-language-to-clusters": {
    percent: 54,
    title: "Matching signals to topics",
  },
  "generate-prompts": {
    percent: 68,
    title: "Drafting buyer prompts",
  },
  "deduplicate-prompts": {
    percent: 78,
    title: "Removing duplicate prompts",
  },
  "score-prompts": {
    percent: 88,
    title: "Ranking prompt quality",
  },
  "create-prompt-universe": {
    percent: 96,
    title: "Preparing review set",
  },
} as const;

function withProgress(
  step: keyof typeof progressSteps,
  node: PromptGenerationNode,
): PromptGenerationNode {
  return async (state, config) => {
    const progress = progressSteps[step];
    await config.configurable?.progress?.({
      step,
      percent: progress.percent,
      title: progress.title,
    });

    return node(state, config);
  };
}

export const graph = new StateGraph(
  StateAnnotation,
  PromptGenerationContextAnnotation,
)
  .addNode(
    "collect-external-documents",
    withProgress("collect-external-documents", collectExternalDocuments),
  )
  .addNode(
    "extract-buyer-language",
    withProgress("extract-buyer-language", extractBuyerLanguage),
  )
  .addNode(
    "score-buyer-language",
    withProgress("score-buyer-language", scoreBuyerLanguage),
  )
  .addNode(
    "create-cluster-taxonomy",
    withProgress("create-cluster-taxonomy", createClusterTaxonomy),
  )
  .addNode(
    "assign-buyer-language-to-clusters",
    withProgress(
      "assign-buyer-language-to-clusters",
      assignBuyerLanguageToClusters,
    ),
  )
  .addNode(
    "generate-prompts",
    withProgress("generate-prompts", generatePrompts),
  )
  .addNode(
    "deduplicate-prompts",
    withProgress("deduplicate-prompts", deduplicatePrompts),
  )
  .addNode("score-prompts", withProgress("score-prompts", scorePrompts))
  .addNode(
    "create-prompt-universe",
    withProgress("create-prompt-universe", createPromptUniverse),
  )
  .addEdge(START, "collect-external-documents")
  .addEdge("collect-external-documents", "extract-buyer-language")
  .addEdge("extract-buyer-language", "score-buyer-language")
  .addEdge("extract-buyer-language", "create-cluster-taxonomy")
  .addEdge(
    ["score-buyer-language", "create-cluster-taxonomy"],
    "assign-buyer-language-to-clusters",
  )
  .addEdge("assign-buyer-language-to-clusters", "generate-prompts")
  .addEdge("generate-prompts", "deduplicate-prompts")
  .addEdge("deduplicate-prompts", "score-prompts")
  .addEdge("score-prompts", "create-prompt-universe")
  .addEdge("create-prompt-universe", END)
  .compile();
