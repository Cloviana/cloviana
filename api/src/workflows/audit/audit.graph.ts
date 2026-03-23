import { END, START, StateGraph } from "@langchain/langgraph";
import {
  buildReport,
  calculateMetrics,
  executeChatgpt,
  executeGoogleAio,
  executePerplexity,
  executeSentiment,
  fetchCompetitors,
  generateContentIdeas,
  generatePrompts,
  initialize,
} from "./nodes";
import { StateAnnotation } from "./audit.state";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("fetch-competitors", fetchCompetitors)
  .addNode("generate-prompts", generatePrompts)
  .addNode("execute-chatgpt", executeChatgpt)
  .addNode("execute-google-aio", executeGoogleAio)
  .addNode("execute-perplexity", executePerplexity)
  .addNode("calculate-metrics", calculateMetrics)
  .addNode("execute-sentiment", executeSentiment)
  .addNode("generate-content-ideas", generateContentIdeas)
  .addNode("build-report", buildReport)
  .addEdge(START, "initialize")
  .addEdge("initialize", "fetch-competitors")
  .addEdge("fetch-competitors", "generate-prompts")
  .addEdge("generate-prompts", "execute-chatgpt")
  .addEdge("generate-prompts", "execute-google-aio")
  .addEdge("generate-prompts", "execute-perplexity")
  .addEdge("generate-prompts", "execute-sentiment")
  .addEdge("execute-chatgpt", "calculate-metrics")
  .addEdge("execute-google-aio", "calculate-metrics")
  .addEdge("execute-perplexity", "calculate-metrics")
  .addEdge("execute-sentiment", "calculate-metrics")
  .addEdge("calculate-metrics", "generate-content-ideas")
  .addEdge("generate-content-ideas", "build-report")
  .addEdge("build-report", END)
  .compile();
