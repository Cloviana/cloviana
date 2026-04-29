import { END, START, StateGraph } from "@langchain/langgraph";
import { AuditContextAnnotation } from "./audit.config";
import { StateAnnotation } from "./audit.state";
import { buildReport } from "./nodes/build-report.node";
import { executeChatgpt } from "./nodes/execute-chatgpt.node";
import { executeGoogleAio } from "./nodes/execute-google-aio.node";
import { executePerplexity } from "./nodes/execute-perplexity.node";
import { executeSentiment } from "./nodes/execute-sentiment.node";
import { generateContentIdeas } from "./nodes/generate-content-ideas.node";
import { generatePrompts } from "./nodes/generate-prompts.node";

export const graph = new StateGraph(StateAnnotation, AuditContextAnnotation)
  .addNode("generate-prompts", generatePrompts)
  .addNode("execute-chatgpt", executeChatgpt)
  .addNode("execute-google-aio", executeGoogleAio)
  .addNode("execute-perplexity", executePerplexity)
  .addNode("execute-sentiment", executeSentiment)
  .addNode("generate-content-ideas", generateContentIdeas)
  .addNode("build-report", buildReport)
  .addEdge(START, "generate-prompts")
  .addEdge("generate-prompts", "execute-chatgpt")
  .addEdge("generate-prompts", "execute-google-aio")
  .addEdge("generate-prompts", "execute-perplexity")
  .addEdge("generate-prompts", "execute-sentiment")
  .addEdge("execute-chatgpt", "generate-content-ideas")
  .addEdge("execute-google-aio", "generate-content-ideas")
  .addEdge("execute-perplexity", "generate-content-ideas")
  .addEdge("execute-sentiment", "generate-content-ideas")
  .addEdge("generate-content-ideas", "build-report")
  .addEdge("build-report", END)
  .compile();
