import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./sync-products.state";
import { fetchProducts, initialize, saveProducts } from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("fetch-products", fetchProducts)
  .addNode("save-products", saveProducts)

  .addEdge(START, "initialize")
  .addEdge("initialize", "fetch-products")
  .addEdge("fetch-products", "save-products")
  .addEdge("save-products", END)

  .compile();
