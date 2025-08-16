import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./sync-products.state";
import { fetchProducts, initialize } from "./nodes";

export const graph = new StateGraph(StateAnnotation)
    .addNode("initialize", initialize)
    .addNode("fetch-products", fetchProducts)

    .addEdge(START, "initialize")
    .addEdge("initialize", "fetch-products")
    .addEdge("fetch-products", END)

    .compile()
