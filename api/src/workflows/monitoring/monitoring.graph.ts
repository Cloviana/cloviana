// LangGraph pipeline: run all engines in parallel, then fan their raw
// responses into mention extraction + fan-out inference, then merge
// everything back together into the final `engineResponses` list.
import { END, START, StateGraph } from "@langchain/langgraph";
import { MonitoringContextAnnotation } from "./monitoring.context";
import { MonitoringStateAnnotation } from "./monitoring.state";
import { assembleEngineResponsesNode } from "./nodes/assemble-engine-responses.node";
import { executeChatgpt } from "./nodes/execute-chatgpt.node";
import { executeClaude } from "./nodes/execute-claude.node";
import { executeGoogleAio } from "./nodes/execute-google-aio.node";
import { executePerplexity } from "./nodes/execute-perplexity.node";
import { extractMentionsNode } from "./nodes/extract-mentions.node";
import { inferFanOutQueriesNode } from "./nodes/infer-fan-out-queries.node";

const ENGINE_NODES = [
  "execute-google-aio",
  "execute-perplexity",
  "execute-claude",
  "execute-chatgpt",
] as const;

export const monitoringGraph = new StateGraph(
  MonitoringStateAnnotation,
  MonitoringContextAnnotation,
)
  .addNode("execute-google-aio", executeGoogleAio)
  .addNode("execute-perplexity", executePerplexity)
  .addNode("execute-claude", executeClaude)
  .addNode("execute-chatgpt", executeChatgpt)
  .addNode("extract-mentions", extractMentionsNode)
  .addNode("infer-fan-out-queries", inferFanOutQueriesNode)
  .addNode("assemble-engine-responses", assembleEngineResponsesNode)

  .addEdge(START, "execute-google-aio")
  .addEdge(START, "execute-perplexity")
  .addEdge(START, "execute-claude")
  .addEdge(START, "execute-chatgpt")

  .addEdge([...ENGINE_NODES], "extract-mentions")
  .addEdge([...ENGINE_NODES], "infer-fan-out-queries")

  .addEdge(
    ["extract-mentions", "infer-fan-out-queries"],
    "assemble-engine-responses",
  )

  .addEdge("assemble-engine-responses", END)

  .compile();
