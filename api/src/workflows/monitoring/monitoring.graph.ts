import { StateGraph } from "@langchain/langgraph";
import { MonitoringContextAnnotation } from "./monitoring.config";
import { StateAnnotation } from "./monitoring.state";
import { executeChatgpt } from "./nodes/execute-chatgpt.node";
import { executeClaude } from "./nodes/execute-claude.node";
import { executeGoogleAio } from "./nodes/execute-google-aio.node";
import { executePerplexity } from "./nodes/execute-perplexity.node";

export const graph = new StateGraph(
  StateAnnotation,
  MonitoringContextAnnotation,
)
  .addNode("execute-google-aio", executeGoogleAio)
  .addNode("execute-perplexity", executePerplexity)
  .addNode("execute-claude", executeClaude)
  .addNode("execute-chatgpt", executeChatgpt)

  .addEdge("__start__", "execute-google-aio")
  .addEdge("__start__", "execute-perplexity")
  .addEdge("__start__", "execute-claude")
  .addEdge("__start__", "execute-chatgpt")

  .addEdge("execute-google-aio", "__end__")
  .addEdge("execute-perplexity", "__end__")
  .addEdge("execute-claude", "__end__")
  .addEdge("execute-chatgpt", "__end__")

  .compile();
