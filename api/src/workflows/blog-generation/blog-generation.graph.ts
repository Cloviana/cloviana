import { START, END, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./blog-generation.state";
import {
  headingSuggestions,
  image,
  initialize,
  outline,
  save,
  sections,
} from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("heading-suggestions", headingSuggestions)
  .addNode("outline", outline)
  .addNode("image", image)
  .addNode("sections", sections)
  .addNode("save", save)

  .addEdge(START, "initialize")
  .addEdge("initialize", "heading-suggestions")
  .addEdge("heading-suggestions", "outline")

  .addEdge("outline", "image")
  .addEdge("outline", "sections")

  .addEdge("image", "save")
  .addEdge("sections", "save")

  .addEdge("save", END)

  .compile();
