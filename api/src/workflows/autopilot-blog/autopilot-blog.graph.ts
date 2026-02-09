import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./autopilot-blog.state";
import {
  initialize,
  selectContentType,
  selectProducts,
  selectPrimaryKeyword,
  selectSecondaryKeywords,
  selectTopic,
  startGeneration,
} from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("initialize", initialize)
  .addNode("select_content_type", selectContentType)
  .addNode("select_products", selectProducts)
  .addNode("select_topic", selectTopic)
  .addNode("select_primary_keyword", selectPrimaryKeyword)
  .addNode("select_secondary_keywords", selectSecondaryKeywords)
  .addNode("start_generation", startGeneration)
  .addEdge(START, "initialize")
  .addEdge("initialize", "select_content_type")
  .addEdge("select_content_type", "select_products")
  .addEdge("select_products", "select_topic")
  .addEdge("select_topic", "select_primary_keyword")
  .addEdge("select_primary_keyword", "select_secondary_keywords")
  .addEdge("select_secondary_keywords", "start_generation")
  .addEdge("start_generation", END)
  .compile();
