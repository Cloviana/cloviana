import { END, START, StateGraph } from "@langchain/langgraph";
import { fetchCollections, fetchProducts, initialize, saveCatalog } from "./nodes";
import { StateAnnotation } from "./sync-catalog.state";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("fetch-collections", fetchCollections)
  .addNode("fetch-products", fetchProducts)
  .addNode("save-catalog", saveCatalog)

  .addEdge(START, "initialize")
  .addEdge("initialize", "fetch-products")
  .addEdge("initialize", "fetch-collections")
  .addEdge("fetch-collections", "save-catalog")
  .addEdge("fetch-products", "save-catalog")
  .addEdge("save-catalog", END)

  .compile();
