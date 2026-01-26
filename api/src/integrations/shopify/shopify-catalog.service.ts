import {
  Article,
  ArticleBlogInput,
  ArticleCreateInput,
  ArticleUpdateInput,
  ArticlesDocument,
  ArticlesQuery,
  ArticlesQueryVariables,
  Collection,
  CollectionsDocument,
  CollectionsQuery,
  CollectionsQueryVariables,
  CreateArticleDocument,
  CreateArticleMutation,
  CreateArticleMutationVariables,
  Product,
  ProductsDocument,
  ProductsQuery,
  ProductsQueryVariables,
  UpdateArticleDocument,
  UpdateArticleMutation,
  UpdateArticleMutationVariables,
} from "@/clients/shopify/generated";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import { Injectable } from "@nestjs/common";
import pRetry from "p-retry";

@Injectable()
export class ShopifyCatalogService {
  constructor(private readonly shopify: ShopifyService) {}

  async listAllProducts(
    shop: string,
    token: string,
    opts?: { query?: string; first?: number },
  ): Promise<Product[]> {
    const client = await this.shopify.getAdminClient(shop, token);
    const pageSize = opts?.first ?? 250;
    let after: string | null = null;
    const all: Product[] = [];
    let shouldContinue = true;

    do {
      const data = await pRetry(
        () =>
          client.request<ProductsQuery, ProductsQueryVariables>(
            ProductsDocument,
            { first: pageSize, after: after ?? undefined, query: opts?.query },
          ),
        { retries: 5, factor: 2, minTimeout: 2000, maxTimeout: 4000 },
      );

      const nodes = (data.products.nodes as Product[]) || [];
      all.push(...nodes);

      if (opts?.first && all.length >= opts.first) {
        shouldContinue = false;
        if (all.length > opts.first) {
          all.length = opts.first;
        }
      } else {
        shouldContinue = data.products.pageInfo.hasNextPage;
        after = data.products.pageInfo.endCursor ?? null;
      }
    } while (shouldContinue && after);
    return all;
  }

  async listAllCollections(
    shop: string,
    token: string,
    opts?: { query?: string; first?: number },
  ): Promise<Collection[]> {
    const client = await this.shopify.getAdminClient(shop, token);
    const pageSize = opts?.first ?? 250;
    let after: string | null = null;
    const all: Collection[] = [];
    let shouldContinue = true;

    do {
      const data = await pRetry(
        () =>
          client.request<CollectionsQuery, CollectionsQueryVariables>(
            CollectionsDocument,
            { first: pageSize, after: after ?? undefined, query: opts?.query },
          ),
        { retries: 5, factor: 2, minTimeout: 500, maxTimeout: 4000 },
      );

      const nodes = (data.collections.nodes as Collection[]) || [];
      all.push(...nodes);

      if (opts?.first && all.length >= opts.first) {
        shouldContinue = false;
        if (all.length > opts.first) {
          all.length = opts.first;
        }
      } else {
        shouldContinue = data.collections.pageInfo.hasNextPage;
        after = data.collections.pageInfo.endCursor ?? null;
      }
    } while (shouldContinue && after);
    return all;
  }

  async listAllArticles(
    shop: string,
    token: string,
    opts?: { query?: string; first?: number },
  ): Promise<Article[]> {
    const client = await this.shopify.getAdminClient(shop, token);
    const pageSize = opts?.first ?? 250;
    let after: string | null = null;
    const all: Article[] = [];
    let shouldContinue = true;

    do {
      const data = await pRetry(
        () =>
          client.request<ArticlesQuery, ArticlesQueryVariables>(
            ArticlesDocument,
            { first: pageSize, after: after ?? undefined, query: opts?.query },
          ),
        { retries: 5, factor: 2, minTimeout: 500, maxTimeout: 4000 },
      );

      const nodes = (data.articles.nodes as Article[]) || [];
      all.push(...nodes);

      if (opts?.first && all.length >= opts.first) {
        shouldContinue = false;
        if (all.length > opts.first) {
          all.length = opts.first;
        }
      } else {
        shouldContinue = data.articles.pageInfo.hasNextPage;
        after = data.articles.pageInfo.endCursor ?? null;
      }
    } while (shouldContinue && after);
    return all;
  }

  async updateArticle(
    shop: string,
    token: string,
    id: string,
    article: ArticleUpdateInput,
    blog?: ArticleBlogInput,
  ): Promise<Article> {
    const client = await this.shopify.getAdminClient(shop, token);

    const data = await pRetry(
      () =>
        client.request<UpdateArticleMutation, UpdateArticleMutationVariables>(
          UpdateArticleDocument,
          { id, article, blog },
        ),
      { retries: 5, factor: 2, minTimeout: 500, maxTimeout: 4000 },
    );

    const result = data.articleUpdate;
    if (!result) throw new Error("No response from Shopify articleUpdate");

    if (result.userErrors?.length) {
      throw new Error(result.userErrors.map((e) => e.message).join("; "));
    }

    if (!result.article) {
      throw new Error("Article not returned after update");
    }

    return result.article as Article;
  }

  async createArticle(
    shop: string,
    token: string,
    article: ArticleCreateInput,
    blog?: ArticleBlogInput,
  ): Promise<Article> {
    const client = await this.shopify.getAdminClient(shop, token);

    const data = await pRetry(
      () =>
        client.request<CreateArticleMutation, CreateArticleMutationVariables>(
          CreateArticleDocument,
          { article, blog },
        ),
      { retries: 5, factor: 2, minTimeout: 500, maxTimeout: 4000 },
    );

    const result = data.articleCreate;
    if (!result) throw new Error("No response from Shopify articleCreate");

    if (result.userErrors?.length) {
      throw new Error(result.userErrors.map((e) => e.message).join("; "));
    }

    if (!result.article) {
      throw new Error("Article not returned after create");
    }

    return result.article as Article;
  }
}
