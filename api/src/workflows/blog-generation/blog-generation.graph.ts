import { START, END, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./blog-generation.state";
import {
  image,
  initialize,
  outline,
  save,
  sections,
} from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("outline", outline)
  .addNode("image", image)
  .addNode("sections", sections)
  .addNode("save", save)

  .addEdge(START, "initialize")
  .addEdge("initialize", "outline")

  .addEdge("outline", "image")
  .addEdge("outline", "sections")

  .addEdge("image", "save")
  .addEdge("sections", "save")

  .addEdge("save", END)

  .compile();
