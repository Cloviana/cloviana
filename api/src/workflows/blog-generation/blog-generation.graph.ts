import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./blog-generation.state";
import { content, image, initialize, outline, save } from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("outline", outline)
  .addNode("image", image)
  .addNode("content", content)
  .addNode("save", save)

  .addEdge(START, "initialize")
  .addEdge("initialize", "outline")
  .addEdge("outline", "image")
  .addEdge("outline", "content")
  .addEdge("content", "save")
  .addEdge("image", "save")
  .addEdge("save", END)

  .compile();
