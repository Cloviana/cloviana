import { Collection, Product } from "@/clients/shopify/generated";
import {
  KeywordMetrics,
  SerpIntent,
} from "@/modules/integrations/seranking/seranking.types";
import { Annotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
  _storeId: Annotation<string>(),
  _token: Annotation<string>(),
  _shop: Annotation<string>(),
  _products: Annotation<Product[]>,
  _collections: Annotation<Collection[]>,
  _keywords:
    Annotation<
      Array<Omit<KeywordMetrics, "is_data_found"> & { intents: SerpIntent[] }>
    >(),
});
