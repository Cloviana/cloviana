import { createHash } from "crypto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { z } from "zod";

import { GroqClient } from "@/clients/groq/groq.client";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { SerpIntent } from "@/modules/seranking/seranking.types";
import { SerankingMetricsService } from "@/modules/seranking/services/seranking.metrics.service";

import {
  SYSTEM_PRIMARY,
  SYSTEM_PRODUCTS,
  SYSTEM_SECONDARY,
  SYSTEM_SEED,
  SYSTEM_TOPICS,
} from "./prompts";

import {
  PrimaryKeywordsSchema,
  ProductsSchema,
  SecondaryKeywordsSchema,
  SeedSchema,
  TopicsSchema,
} from "./schemas";

import { type KeywordSuggestion } from "@/modules/suggestions/suggestions.types";

const TWO_DAYS_MS = 1000 * 60 * 60 * 24 * 2;
const CACHE_NS = "suggestions";
const CACHE_V = "v1";

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly groq = new GroqClient();

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly metrics: SerankingMetricsService,
    private readonly prisma: PrismaService,
  ) {}

  // Stable short hash for cache keys / signatures
  private shortHash(input: unknown) {
    return createHash("sha256")
      .update(typeof input === "string" ? input : JSON.stringify(input))
      .digest("hex")
      .slice(0, 10);
  }

  // Suggest 5 evergreen topics for a store (auto-refreshes on catalog changes)
  async suggestTopic(storeId: string): Promise<string[]> {
    try {
      const store = await this.prisma.store.findUniqueOrThrow({
        where: { id: storeId },
        select: {
          id: true,
          name: true,
          description: true,
          products: {
            take: 50,
            orderBy: { createdAt: "desc" },
            select: { id: true, title: true, description: true },
          },
        },
      });

      const sig = this.shortHash([
        store.name,
        store.description ?? "",
        store.products.map((p) => [
          p.id,
          p.title,
          (p.description ?? "").slice(0, 120),
        ]),
      ]);
      const key = `${CACHE_NS}:${CACHE_V}:topics:${storeId}:${sig}`;

      const cached = await this.cache.get<string[]>(key);
      if (cached?.length) {
        this.logger.debug(`topics hit store=${storeId} sig=${sig}`);
        return cached;
      }
      this.logger.debug(`topics miss store=${storeId} sig=${sig}`);

      const payload = {
        store: {
          name: store.name,
          description: store.description ?? "",
          products: store.products.map((p) => ({
            title: p.title,
            description: p.description ?? "",
          })),
        },
      };

      const res = await this.groq.chatJson<z.infer<typeof TopicsSchema>>({
        name: "topics",
        schema: TopicsSchema,
        messages: [
          { role: "system", content: SYSTEM_TOPICS },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.7,
      });

      const topics = Array.from(
        new Set(res.topics.map((t) => t.trim())),
      ).filter(Boolean);
      if (topics.length !== 5) {
        this.logger.warn(
          `topics invalid len=${topics.length} store=${storeId}`,
        );
        throw new Error("invalid topics length");
      }

      await this.cache.set(key, topics, TWO_DAYS_MS);
      this.logger.debug(`topics cached store=${storeId} sig=${sig}`);
      return topics;
    } catch (e: any) {
      this.logger.error(
        `topics error store=${storeId}: ${e?.message}`,
        e?.stack,
      );
      throw e;
    }
  }

  // Picks a seed → gets SERanking related → selects 12 primary keywords.
  async suggestPrimaryKeyword(blogId: string): Promise<KeywordSuggestion[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        include: {
          products: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              title: true,
              tags: true,
              category: true,
              description: true,
            },
          },
        },
      });

      const topic = (blog.topic ?? "").trim();
      if (!topic) {
        this.logger.warn(`primary missing topic blog=${blogId}`);
        throw new Error("topic not set on blog");
      }

      const products = (blog.products ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        tags: p.tags ?? [],
        category: p.category ?? null,
        description: (p.description ?? "").slice(0, 500),
      }));

      const prodSig = this.shortHash(
        products.map((p) => [p.id, p.title, p.category, p.tags]),
      );
      const key = `${CACHE_NS}:${CACHE_V}:primary:${blogId}:${this.shortHash(
        topic,
      )}:${prodSig}`;

      const cached = await this.cache.get<KeywordSuggestion[]>(key);
      if (cached?.length) {
        this.logger.debug(`primary hit blog=${blogId}`);
        return cached;
      }
      this.logger.debug(`primary miss blog=${blogId} topic="${topic}"`);

      const seedObj = await this.groq.chatJson<z.infer<typeof SeedSchema>>({
        name: "seed",
        schema: SeedSchema,
        messages: [
          { role: "system", content: SYSTEM_SEED },
          { role: "user", content: JSON.stringify({ topic, products }) },
        ],
        temperature: 0.2,
      });

      const seed = seedObj.seed.trim();
      if (!seed) {
        this.logger.warn(`seed empty blog=${blogId}`);
        throw new Error("invalid seed");
      }
      this.logger.debug(`seed="${seed}" blog=${blogId} — fetching related`);

      const related = await this.metrics.getRelated({
        source: "us",
        keyword: seed,
        limit: 50,
        history_trend: false,
        filter: { volume: { from: 300 }, difficulty: { to: 30 } },
      });

      const candidates = related.items
        .map((k) => ({
          keyword: k.keyword,
          volume: k.volume ?? 0,
          difficulty: k.difficulty ?? 0,
          intents: (k.intents ?? []) as SerpIntent[],
        }))
        .filter((k) => k.keyword);

      if (!candidates.length) {
        this.logger.warn(`primary no candidates blog=${blogId} seed="${seed}"`);
        return [];
      }

      const primary = await this.groq.chatJson<
        z.infer<typeof PrimaryKeywordsSchema>
      >({
        name: "primary_keywords",
        schema: PrimaryKeywordsSchema,
        messages: [
          { role: "system", content: SYSTEM_PRIMARY },
          {
            role: "user",
            content: JSON.stringify({
              topic,
              products,
              seed,
              candidates: candidates.map((c) => ({
                keyword: c.keyword,
                volume: c.volume,
                difficulty: c.difficulty,
                intents: c.intents,
              })),
            }),
          },
        ],
        temperature: 0.3,
      });

      const meta = new Map(candidates.map((c) => [c.keyword.toLowerCase(), c]));
      const out: KeywordSuggestion[] = primary.items.map((x) => {
        const m = meta.get(x.keyword.toLowerCase());
        return {
          keyword: x.keyword,
          volume: m?.volume,
          difficulty: m?.difficulty,
          intent: m?.intents?.[0],
          recommended: x.recommended,
        };
      });

      await this.cache.set(key, out, TWO_DAYS_MS);
      this.logger.debug(`primary cached blog=${blogId}`);
      return out;
    } catch (e: any) {
      this.logger.error(
        `primary error blog=${blogId}: ${e?.message}`,
        e?.stack,
      );
      throw e;
    }
  }

  // Chooses 30 secondaries (5 recommended) using stored topic/primary and attached products.
  async suggestSecondaryKeywords(blogId: string): Promise<KeywordSuggestion[]> {
    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      include: {
        products: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            tags: true,
            category: true,
            description: true,
          },
        },
      },
    });

    const topic = (blog.topic ?? "").trim();
    const primaryKeyword = (blog.primaryKeyword ?? "").trim();

    if (!topic || !primaryKeyword) {
      this.logger.warn(
        `secondary missing inputs blog=${blogId} topic="${topic}" primary="${primaryKeyword}"`,
      );
      throw new Error("topic and primaryKeyword must be set on blog");
    }

    const products = (blog.products ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      tags: p.tags ?? [],
      category: p.category ?? null,
      description: (p.description ?? "").slice(0, 500),
    }));

    const prodSig = this.shortHash(
      products.map((p) => [p.id, p.title, p.category, p.tags]),
    );
    const key = `${CACHE_NS}:${CACHE_V}:secondary:${blogId}:${this.shortHash(
      topic,
    )}:${this.shortHash(primaryKeyword)}:${prodSig}`;

    try {
      const cached = await this.cache.get<KeywordSuggestion[]>(key);
      if (cached?.length) {
        this.logger.debug(`secondary hit blog=${blogId}`);
        return cached;
      }
      this.logger.debug(`secondary miss blog=${blogId}`);

      const related = await this.metrics.getRelated({
        source: "us",
        keyword: primaryKeyword,
        limit: 50,
        history_trend: false,
        filter: { volume: { from: 100 }, difficulty: { to: 45 } },
      });

      const candidates = related.items
        .map((k) => ({
          keyword: k.keyword,
          volume: k.volume ?? 0,
          difficulty: k.difficulty ?? 0,
          intents: (k.intents ?? []) as SerpIntent[],
        }))
        .filter((k) => k.keyword);

      if (!candidates.length) {
        this.logger.warn(
          `secondary no candidates blog=${blogId} primary="${primaryKeyword}"`,
        );
        return [];
      }

      const res = await this.groq.chatJson<
        z.infer<typeof SecondaryKeywordsSchema>
      >({
        name: "secondary_keywords",
        schema: SecondaryKeywordsSchema,
        messages: [
          { role: "system", content: SYSTEM_SECONDARY },
          {
            role: "user",
            content: JSON.stringify({
              topic,
              primaryKeyword,
              products,
              candidates: candidates.map((c) => ({
                keyword: c.keyword,
                volume: c.volume,
                difficulty: c.difficulty,
                intents: c.intents,
              })),
            }),
          },
        ],
        temperature: 0.3,
      });

      const meta = new Map(candidates.map((c) => [c.keyword.toLowerCase(), c]));
      const out: KeywordSuggestion[] = res.items.map((x) => {
        const m = meta.get(x.keyword.toLowerCase());
        return {
          keyword: x.keyword,
          volume: m?.volume,
          difficulty: m?.difficulty,
          intent: m?.intents?.[0],
          recommended: x.recommended,
        };
      });

      await this.cache.set(key, out, TWO_DAYS_MS);
      this.logger.debug(`secondary cached blog=${blogId}`);
      return out;
    } catch (e: any) {
      this.logger.error(
        `secondary error blog=${blogId}: ${e?.message}`,
        e?.stack,
      );
      throw e;
    }
  }

  // Picks up to 3 recommended products for the topic from the blog's store catalog.
  async suggestProduct(blogId: string): Promise<
    Array<{
      id: string;
      title: string;
      imageUrl: string | null;
      recommended: boolean;
    }>
  > {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: { storeId: true, topic: true },
      });

      const topic = (blog.topic ?? "").trim();
      if (!topic) {
        this.logger.warn(`product missing topic blog=${blogId}`);
        throw new Error("topic not set on blog");
      }

      const products = await this.prisma.product.findMany({
        where: { storeId: blog.storeId, status: "ACTIVE" },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          category: true,
          imageUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      if (!products.length) {
        this.logger.warn(
          `product no catalog blog=${blogId} store=${blog.storeId}`,
        );
        return [];
      }

      const catalogSig = this.shortHash(
        products.map((p) => [p.id, p.title, p.category, p.tags]),
      );
      const key = `${CACHE_NS}:${CACHE_V}:product:${blogId}:${this.shortHash(
        topic,
      )}:${catalogSig}`;

      const cached =
        await this.cache.get<
          Array<{
            id: string;
            title: string;
            imageUrl: string | null;
            recommended: boolean;
          }>
        >(key);
      if (cached?.length) {
        this.logger.debug(`product hit blog=${blogId}`);
        return cached;
      }
      this.logger.debug(`product miss blog=${blogId} topic="${topic}"`);

      const picked = await this.groq.chatJson<z.infer<typeof ProductsSchema>>({
        name: "products",
        schema: ProductsSchema,
        messages: [
          { role: "system", content: SYSTEM_PRODUCTS },
          {
            role: "user",
            content: JSON.stringify({
              topic,
              products: products.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description ?? "",
                tags: p.tags ?? [],
                category: p.category ?? "",
              })),
            }),
          },
        ],
        temperature: 0.2,
      });

      const chosenSet = new Set(picked.recommendedIds);
      const out = products.map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl ?? null,
        recommended: chosenSet.has(p.id),
      }));

      await this.cache.set(key, out, TWO_DAYS_MS);
      this.logger.debug(`product cached blog=${blogId}`);
      return out;
    } catch (e: any) {
      this.logger.error(
        `product error blog=${blogId}: ${e?.message}`,
        e?.stack,
      );
      throw e;
    }
  }
}
