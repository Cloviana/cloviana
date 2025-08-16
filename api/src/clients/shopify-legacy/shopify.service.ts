import { Inject, Injectable } from "@nestjs/common";
import type { shopifyApi } from "@shopify/shopify-api";
import { Session } from "@shopify/shopify-api";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: any }>;
}

@Injectable()
export class ShopifyService {
  constructor(
    @Inject("SHOPIFY_CLIENT")
    private readonly shopify: ReturnType<typeof shopifyApi>,
  ) {}

  private graphqlClient(shop: string, accessToken: string) {
    const session = new Session({
      id: `offline-${shop}`,
      shop,
      state: "",
      isOnline: false,
      accessToken,
    });

    return new this.shopify.clients.Graphql({ session });
  }

  async runMutation<T>(
    shop: string,
    accessToken: string,
    query: string,
    variables?: any,
  ): Promise<T> {
    const client = this.graphqlClient(shop, accessToken);
    const { body } = await client.query<GraphQLResponse<T>>({
      data: { query, variables },
    });
    if (!body) throw new Error("No response body");
    if (body.errors?.length) throw new Error(JSON.stringify(body.errors));
    if (body.data === undefined) throw new Error("No data");
    return body.data;
  }
}
