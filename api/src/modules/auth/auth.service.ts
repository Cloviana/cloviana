import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  GetShopInfoDocument,
  GetShopInfoQuery,
  GetShopInfoQueryVariables,
} from "@/clients/shopify/generated";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import { Smtp2GoClient } from "@/clients/smtp/services/smtp2go.service";
import { SupabaseService } from "@/clients/supabase/supabase.service";
import { AppConfiguration } from "@/config/app.configuration";
import { ShopifyCallbackDto } from "@/modules/auth/dtos/shopify-callback.dto";
import { StoresProducer } from "@/modules/messaging/producers/stores.producer";
import { resolveFavicon } from "@/utils/resolve-favicon.util";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PlanName, StoreStatus, SubscriptionStatus } from "@prisma/client";

type InstallStateCache = {
  uid: string | null;
  storeId: string | null;
  shop: string;
  src: "app" | "shopify";
};

const STATE_TTL_MS = 24 * 60 * 60 * 1000;
const STATE_NS = "shopify:state";

// --- Ticket constants ---
const TICKET_NS = "shopify:ticket";
const TICKET_TTL_MS = 5 * 60 * 1000; // 5 minutes

type TicketPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  store_id: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: AppConfiguration,
    private readonly shopify: ShopifyService,
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly storesProducer: StoresProducer,
    private readonly mailer: Smtp2GoClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async verifyOwnership(userId: string, storeId: string): Promise<boolean> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId, ownerId: userId },
    });
    return !!store;
  }

  // ---- STATE (anti-CSRF) helpers ----
  private stateKey(id: string) {
    return `${STATE_NS}:${id}`;
  }

  private sign(id: string) {
    // reuse existing secret; ideally use a dedicated secret in config
    return createHmac("sha256", this.config.supabaseJwtSecret)
      .update(id)
      .digest("base64url");
  }

  private verifySignedState(state: string): string | null {
    const parts = state.split(".");
    if (parts.length !== 2) return null;
    const [id, sig] = parts;
    const expSig = this.sign(id);
    const a = Buffer.from(expSig, "utf8");
    const b = Buffer.from(sig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return id;
  }

  async createCachedState(input: {
    uid: string | null;
    storeId: string | null;
    shop: string;
    src: "app" | "shopify";
  }) {
    const id = randomUUID();
    const value: InstallStateCache = {
      uid: input.uid,
      storeId: input.storeId,
      shop: input.shop,
      src: input.src,
    };
    await this.cache.set(
      this.stateKey(id),
      JSON.stringify(value),
      STATE_TTL_MS,
    );
    const sig = this.sign(id);
    return `${id}.${sig}`;
  }

  async consumeCachedState(state: string): Promise<InstallStateCache | null> {
    const id = this.verifySignedState(state);
    if (!id) return null;
    const key = this.stateKey(id);
    const raw = await this.cache.get<string>(key);
    if (!raw) return null;
    await this.cache.del(key); // single-use
    return JSON.parse(raw) as InstallStateCache;
  }

  // ---- TICKET (one-time login) helpers ----
  private ticketKey(id: string) {
    return `${TICKET_NS}:${id}`;
  }

  async createLoginTicket(payload: TicketPayload) {
    const id = randomUUID(); // opaque, random
    await this.cache.set(
      this.ticketKey(id),
      JSON.stringify(payload),
      TICKET_TTL_MS,
    );
    return id;
  }

  async consumeLoginTicket(id: string): Promise<TicketPayload | null> {
    const key = this.ticketKey(id);
    const raw = await this.cache.get<string>(key);
    if (!raw) return null;
    await this.cache.del(key); // single-use
    return JSON.parse(raw) as TicketPayload;
  }

  // ---- Shopify helpers ----
  async buildShopifyAuthUrl(shop: string, state?: string): Promise<string> {
    const url = new URL(`https://${shop}/admin/oauth/authorize`);
    url.searchParams.set("client_id", this.config.shopifyApiKey);
    url.searchParams.set(
      "redirect_uri",
      `${this.config.apiUrl}/auth/shopify/callback`,
    );
    url.searchParams.set(
      "state",
      state ??
        (await this.createCachedState({
          uid: null,
          storeId: null,
          shop,
          src: "shopify",
        })),
    );
    return url.toString();
  }

  verifyShopifyHmac(rawUrl: string, providedHmac: string) {
    // Verify HMAC according to Shopify docs (exclude hmac/signature, sort query)
    const qs = rawUrl.split("?")[1] || "";
    const params = new URLSearchParams(qs);
    params.delete("hmac");
    params.delete("signature");
    const pairs = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const digestHex = createHmac("sha256", this.config.shopifyApiSecret)
      .update(pairs)
      .digest("hex");
    const a = Buffer.from(digestHex, "hex");
    const b = Buffer.from(String(providedHmac).toLowerCase(), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new Error("Invalid HMAC");
  }

  // Create a Supabase session *server-side* without emailing a link
  // by generating a link and verifying its hashed token immediately.
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

  private generatePassword(length = 16): string {
    return randomBytes(length)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, length);
  }

  private async getStarterPlan() {
    const plan = await this.prisma.plan.findFirst({
      where: { name: PlanName.STARTER },
    });
    if (!plan) throw new BadRequestException("Starter plan is not configured");
    return plan;
  }

  private isStoreInitialized(status: StoreStatus): boolean {
    return status === StoreStatus.ACTIVE || status === StoreStatus.INITIALIZING;
  }

  // 1) Verify integrity + CSRF state, then exchange code for token, then read shop info.
  // 2) Branch by origin:
  //    A. App-initiated install (ctx.storeId present): bind this Shopify shop to that store; ignore Shopify email for ownership.
  //    B. Re-install or already-connected shop (existingChannel present): refresh token and sign in the store owner.
  //    C. Marketplace install where Shopify email already exists in your app: create a store for that owner and connect the channel.
  //    D. Brand-new user from marketplace: create user + store + channel, send welcome, and sign in.

  async handleShopifyCallback(data: ShopifyCallbackDto): Promise<string> {
    // --- Integrity: verify our anti-CSRF state ---
    const ctx = await this.consumeCachedState(String(data.state));
    if (!ctx) throw new BadRequestException("Invalid state");

    // --- OAuth token exchange (offline access token) ---
    const tokenResp = await fetch(
      `https://${data.shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.config.shopifyApiKey,
          client_secret: this.config.shopifyApiSecret,
          code: data.code,
        }),
      },
    );
    const tokenBody = await tokenResp.json();
    const offlineAccessToken = tokenBody.access_token;
    if (!tokenResp.ok || !offlineAccessToken) {
      throw new BadRequestException(
        `Token exchange failed: ${tokenResp.status} ${JSON.stringify(
          tokenBody,
        )}`,
      );
    }

    // --- Early check: does a channel for this shop already exist? ---
    const existingChannel = await this.prisma.channel.findUnique({
      where: { shop: data.shop },
    });

    // --- Read shop info (email/name) for marketplace linking paths ---
    const shopifyAdminClient = await this.shopify.getAdminClient(
      data.shop,
      offlineAccessToken,
    );
    const {
      shop: { email: shopEmail, name: shopName },
    } = await shopifyAdminClient.request<
      GetShopInfoQuery,
      GetShopInfoQueryVariables
    >(GetShopInfoDocument, {});
    const profileUrl = await resolveFavicon(`https://${data.shop}`);

    // ===== CASE A: App-initiated install — user selected a specific store in your app =====
    // Bind the Shopify shop to that store; enforce ownership by ctx.uid; ignore Shopify email for ownership.
    if (ctx.storeId) {
      const store = await this.prisma.store.findUniqueOrThrow({
        where: { id: ctx.storeId },
      });
      if (store.ownerId !== ctx.uid) throw new BadRequestException("Forbidden");

      // Prevent connecting the same Shopify shop to a different store.
      if (existingChannel && existingChannel.storeId !== store.id) {
        throw new BadRequestException(
          "This Shopify store is already connected to another store",
        );
      }

      await this.prisma.channel.upsert({
        where: { shop: data.shop },
        create: {
          shop: data.shop,
          store: { connect: { id: store.id } },
          config: { offlineAccessToken },
        },
        update: { storeId: store.id, config: { offlineAccessToken } },
      });

      const shouldInit = !this.isStoreInitialized(store.status);

      if (shouldInit) {
        await this.storesProducer.init({ storeId: store.id });
      }

      const owner = await this.prisma.profile.findUniqueOrThrow({
        where: { id: store.ownerId },
        select: { email: true },
      });
      const session = await this.signInViaLink("recovery", owner.email);

      const ticket = await this.createLoginTicket({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        user_id: session.user_id,
        store_id: store.id,
      });

      return `${this.config.appUrl}/api/auth/complete?ticket=${ticket}`;
    }

    // ===== CASE B: Re-install / already-connected shop (marketplace flow without ctx.storeId) =====
    // If channel exists, refresh token, init store, and sign in that store's owner.
    if (existingChannel) {
      const store = await this.prisma.store.findUniqueOrThrow({
        where: { id: existingChannel.storeId },
      });

      await this.prisma.channel.update({
        where: { shop: data.shop },
        data: { config: { offlineAccessToken } },
      });

      const shouldInit = !this.isStoreInitialized(store.status);

      if (shouldInit) {
        await this.storesProducer.init({ storeId: store.id });
      }

      const owner = await this.prisma.profile.findUniqueOrThrow({
        where: { id: store.ownerId },
        select: { email: true },
      });
      const session = await this.signInViaLink("recovery", owner.email);

      const ticket = await this.createLoginTicket({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        user_id: session.user_id,
        store_id: store.id,
      });

      return `${this.config.appUrl}/api/auth/complete?ticket=${ticket}`;
    }

    // ===== CASE C: Marketplace install — profile with the Shopify shop email already exists =====
    // Create a new store under that profile and connect the Shopify channel.
    const profile = await this.prisma.profile.findUnique({
      where: { email: shopEmail },
    });

    if (profile) {
      const starterPlan = await this.getStarterPlan();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const store = await this.prisma.store.create({
        data: {
          owner: { connect: { id: profile.id } },
          name: shopName,
          domainUrl: data.shop,
          profileUrl,
          subscription: {
            create: {
              status: SubscriptionStatus.TRIALLING,
              trialEndsAt,
              plan: { connect: { id: starterPlan.id } },
            },
          },
          channel: {
            create: {
              shop: data.shop,
              config: { offlineAccessToken },
            },
          },
        },
      });

      await this.storesProducer.init({ storeId: store.id });

      const session = await this.signInViaLink("recovery", shopEmail);

      const ticket = await this.createLoginTicket({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        user_id: session.user_id,
        store_id: store.id,
      });

      return `${this.config.appUrl}/api/auth/complete?ticket=${ticket}`;
    }

    // ===== CASE D: Marketplace install — brand-new user =====
    // Create user, create store, connect channel, send welcome, and sign in.
    const supabaseAdmin = this.supabase.getAdminClient();
    const password = this.generatePassword(16);
    const created = await supabaseAdmin.auth.admin.createUser({
      email: shopEmail,
      email_confirm: true,
      password,
      user_metadata: { contactEmail: shopEmail },
    });

    const starterPlan = await this.getStarterPlan();

    const newStore = await this.prisma.$transaction(async (tx) => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const store = await tx.store.create({
        data: {
          owner: { connect: { id: created.data.user?.id } },
          name: shopName,
          domainUrl: data.shop,
          profileUrl,
          subscription: {
            create: {
              status: SubscriptionStatus.TRIALLING,
              trialEndsAt,
              plan: { connect: { id: starterPlan.id } },
            },
          },
        },
      });
      await tx.channel.create({
        data: {
          shop: data.shop,
          storeId: store.id,
          config: { offlineAccessToken },
        },
      });
      return store;
    });

    await this.storesProducer.init({ storeId: newStore.id });

    await this.mailer.sendMail({
      to: shopEmail,
      subject: "Your Cloviana account",
      text: `Welcome to Cloviana.\n\nEmail: ${shopEmail}\nPassword: ${password}\n\nYou can change your password in your account settings.`,
      html: `
        <p>Welcome to <strong>Cloviana</strong>.</p>
        <p><strong>Email:</strong> ${shopEmail}<br/><strong>Password:</strong> ${password}</p>
        <p>You can change your password in your account settings.</p>
      `,
    });

    const session = await this.signInViaLink("recovery", shopEmail);

    const ticket = await this.createLoginTicket({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      user_id: session.user_id,
      store_id: newStore.id,
    });

    return `${this.config.appUrl}/api/auth/complete?ticket=${ticket}`;
  }
}
