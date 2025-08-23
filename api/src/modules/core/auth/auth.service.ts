import { BadRequestException, Injectable } from "@nestjs/common";
import pRetry from "p-retry";
import { AppConfiguration } from "@/config/app.configuration";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import { SupabaseService } from "@/clients/supabase/supabase.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  GetShopInfoDocument,
  GetShopInfoQuery,
  GetShopInfoQueryVariables,
} from "@/clients/shopify/generated";
import { resolveFavicon } from "@/utils/resolve-favicon.util";
import { StoresProducer } from "@/modules/integrations/messaging/producers/stores.producer";

type SessionOut = {
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_in: number | null;
  created_user: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: AppConfiguration,
    private readonly shopify: ShopifyService,
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly storesProducer: StoresProducer,
  ) {}

  async exchangeAndIssueSession(input: {
    shop: string;
    code: string;
    state: string;
  }) {
    const { shop, code, state } = input;
    if (!shop || !code || !state)
      throw new BadRequestException("Missing parameters");

    const offlineAccessToken = await this.exchangeCode(shop, code);
    const { email, name, myshopifyDomain } = await this.getShopInfo(
      shop,
      offlineAccessToken,
    );
    if (!email)
      throw new BadRequestException(`Shop ${shop} has no contact email`);

    const { user_id, access_token, refresh_token, expires_in, created_user } =
      await this.createOrSignInUser(email, {
        shop_domain: myshopifyDomain,
        shop_name: name,
      });

    const { storeId, channelId, link_status } =
      await this.ensureStoreAndChannel({
        ownerId: user_id,
        shopName: name,
        domain: myshopifyDomain,
        offlineAccessToken,
      });

    return {
      access_token,
      refresh_token,
      expires_in,
      user_id,
      shop_domain: myshopifyDomain,
      shop_name: name,
      store_id: storeId,
      channel_id: channelId,
      created_user,
      link_status,
    };
  }

  private async createOrSignInUser(
    email: string,
    metadata: Record<string, any>,
  ): Promise<SessionOut> {
    const admin = this.supabase.getAdminClient();
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (!created.error) {
      const { access_token, refresh_token, expires_in, user_id } =
        await this.signInViaLink("magiclink", email);
      return {
        user_id,
        access_token,
        refresh_token,
        expires_in,
        created_user: true,
      };
    }

    const exists =
      (created.error as any).code === "email_exists" ||
      /already\s+been?\s+registered/i.test(created.error.message || "");
    if (!exists) throw created.error;

    const link = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: this.config.appUrl },
    });
    const user = link.data?.user;
    if (!user) throw new BadRequestException("User lookup failed");

    const providers = (user.identities || []).map((i) => i.provider);
    const hasEmail = providers.includes("email");
    const hasOauthOnly =
      !hasEmail && providers.some((p) => p === "google" || p === "apple");
    if (hasOauthOnly)
      throw new BadRequestException(
        "This email is registered via Google/Apple. Sign in with that provider.",
      );

    const { access_token, refresh_token, expires_in, user_id } =
      await this.signInViaLink("recovery", email);
    return {
      user_id,
      access_token,
      refresh_token,
      expires_in,
      created_user: false,
    };
  }

  private async signInViaLink(type: "magiclink" | "recovery", email: string) {
    const admin = this.supabase.getAdminClient();
    const gen = await admin.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo: this.config.appUrl },
    });
    const token_hash = gen.data?.properties?.hashed_token;
    if (!token_hash)
      throw new BadRequestException("Magic link generation failed");
    const anon = this.supabase.getAnonClient();
    const v = await anon.auth.verifyOtp({
      type: type === "magiclink" ? "email" : "recovery",
      token_hash,
    });
    if (v.error) throw v.error;
    if (!v.data.session) throw new BadRequestException("No session returned");
    return {
      access_token: v.data.session.access_token,
      refresh_token: v.data.session.refresh_token,
      expires_in: v.data.session.expires_in,
      user_id: v.data.session.user.id,
    };
  }

  private async ensureStoreAndChannel(args: {
    ownerId: string;
    shopName: string;
    domain: string;
    offlineAccessToken: string;
  }) {
    const { ownerId, shopName, domain, offlineAccessToken } = args;

    return this.prisma.$transaction(async (tx) => {
      let store = await tx.store.findFirst({ where: { ownerId } });
      if (!store) {
        const profileUrl = await resolveFavicon(domain);
        store = await tx.store.create({
          data: { ownerId, name: shopName, domainUrl: domain, profileUrl },
        });
      } else if (!store.domainUrl) {
        store = await tx.store.update({
          where: { id: store.id },
          data: { domainUrl: domain },
        });
      }

      const existing = await tx.channel.findUnique({ where: { shop: domain } });
      if (existing && existing.storeId && existing.storeId !== store.id) {
        throw new BadRequestException("Shop already linked to another store");
      }

      const channel = existing
        ? await tx.channel.update({
            where: { id: existing.id },
            data: { storeId: store.id, config: { offlineAccessToken } },
          })
        : await tx.channel.create({
            data: {
              shop: domain,
              storeId: store.id,
              config: { offlineAccessToken },
            },
          });

      if (!existing) await this.storesProducer.init({ storeId: store.id });

      return {
        storeId: store.id,
        channelId: channel.id,
        link_status: existing ? "UPDATED" : "CREATED",
      };
    });
  }

  private async getShopInfo(shop: string, token: string) {
    const client = await this.shopify.getAdminClient(shop, token);
    const { shop: s } = await pRetry(
      () =>
        client.request<GetShopInfoQuery, GetShopInfoQueryVariables>(
          GetShopInfoDocument,
        ),
      { retries: 5, factor: 2, minTimeout: 2000, maxTimeout: 4000 },
    );
    return { email: s.email, name: s.name, myshopifyDomain: s.myshopifyDomain };
  }

  private async exchangeCode(shop: string, code: string): Promise<string> {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.config.shopifyApiKey,
        client_secret: this.config.shopifyApiSecret,
        code,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.access_token)
      throw new BadRequestException(`Token exchange failed: ${res.status}`);
    return data.access_token as string;
  }
}
