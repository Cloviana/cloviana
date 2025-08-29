import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./store-metadata.state";
import {
  createMetadata,
  fetchArticles,
  fetchCollections,
  fetchProducts,
  initialize,
} from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("fetch-products", fetchProducts)
  .addNode("fetch-collections", fetchCollections)
  .addNode("fetch-articles", fetchArticles)
  .addNode("create-metadata", createMetadata)

  .addEdge(START, "initialize")

  .addEdge("initialize", "fetch-products")
  .addEdge("initialize", "fetch-collections")
  .addEdge("initialize", "fetch-articles")

  .addEdge("fetch-products", "create-metadata")
  .addEdge("fetch-collections", "create-metadata")
  .addEdge("fetch-articles", "create-metadata")

  .addEdge("create-metadata", END)

  .compile();
