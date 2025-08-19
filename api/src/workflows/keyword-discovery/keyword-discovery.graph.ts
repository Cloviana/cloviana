import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./keyword-discovery.state";
import { fetchCollections, fetchProducts, generateKeywords, initialize, saveKeywords } from "./nodes";

const join = async () => ({});

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("fetch-products", fetchProducts)
  .addNode("fetch-collections", fetchCollections)
  .addNode("join", join)
  .addNode("generate-keywords", generateKeywords)
  .addNode("save-keywords", saveKeywords)
  
  .addEdge(START, "initialize")
  .addEdge("initialize", "fetch-products")
  .addEdge("initialize", "fetch-collections")
  .addEdge("fetch-products", "join")
  .addEdge("fetch-collections", "join")
  .addEdge("join", "generate-keywords")
  .addEdge("generate-keywords", "save-keywords")
  .addEdge("save-keywords", END)
  .compile();
