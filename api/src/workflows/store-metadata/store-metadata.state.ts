import { Article, Collection, Product } from "@/clients/shopify/generated";
import { Annotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
  _storeId: Annotation<string>(),
  _token: Annotation<string>(),
  _shop: Annotation<string>(),
  _products: Annotation<Product[]>,
  _collections: Annotation<Collection[]>,
  _articles: Annotation<Article[]>,
});
