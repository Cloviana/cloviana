import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../store-metadata.state";
import { CatalogService } from "@/modules/commerce/catalog/catalog.service";

export async function fetchArticles(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const catalog = configurable?.catalog as CatalogService;
  if (!catalog) throw new Error("Catalog service not provided");

  const first = 5;
  const articles = await catalog.listAllArticles(state._shop, state._token, {
    first,
    query: "status:published",
  });

  return { _articles: articles };
}
