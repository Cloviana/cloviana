import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./business-initialization.state";
import { runPromptResearch } from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("run-prompt-research", runPromptResearch)
  .addEdge(START, "run-prompt-research")
  .addEdge("run-prompt-research", END)
  .compile();
