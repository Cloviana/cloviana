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
import { PromptGenerationContextAnnotation } from "./prompt-generation.config";
import { StateAnnotation } from "./prompt-generation.state";

export const graph = new StateGraph(
  StateAnnotation,
  PromptGenerationContextAnnotation,
)
  .addNode("collect-external-documents", collectExternalDocuments)
  .addNode("extract-buyer-language", extractBuyerLanguage)
  .addNode("score-buyer-language", scoreBuyerLanguage)
  .addNode("create-cluster-taxonomy", createClusterTaxonomy)
  .addNode("assign-buyer-language-to-clusters", assignBuyerLanguageToClusters)
  .addNode("generate-prompts", generatePrompts)
  .addNode("deduplicate-prompts", deduplicatePrompts)
  .addNode("score-prompts", scorePrompts)
  .addNode("create-prompt-universe", createPromptUniverse)
  .addEdge(START, "collect-external-documents")
  .addEdge("collect-external-documents", "extract-buyer-language")
  .addEdge("extract-buyer-language", "score-buyer-language")
  .addEdge("score-buyer-language", "create-cluster-taxonomy")
  .addEdge("create-cluster-taxonomy", "assign-buyer-language-to-clusters")
  .addEdge("assign-buyer-language-to-clusters", "generate-prompts")
  .addEdge("generate-prompts", "deduplicate-prompts")
  .addEdge("deduplicate-prompts", "score-prompts")
  .addEdge("score-prompts", "create-prompt-universe")
  .addEdge("create-prompt-universe", END)
  .compile();
