import { createHash } from "crypto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { z } from "zod";

import { GroqClient } from "@/clients/groq/groq.client";
import { PrismaService } from "@/clients/prisma/prisma.service";

import {
  TopicsSchema,
  SelectedKeywordsSchema,
  SeedSchema,
} from "../schemas";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import {
  KeywordIdeasTask,
  KeywordSuggestionsTask,
} from "@/integrations/dataforseo/dataforseo.types";
import type {
  KeywordCandidate,
  SuggestedKeyword,
} from "@/modules/blogs/types/suggestions.types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TWO_DAYS_MS = 1000 * 60 * 60 * 24 * 2;
const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const CACHE_NS = "suggestions";
const CACHE_V = "v2";

const DATAFORSEO_LOCATION = 2840;
const DATAFORSEO_LANGUAGE = "en";

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly groq = new GroqClient();

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly prisma: PrismaService,
    private readonly dataForSeo: DataForSeoService
  ) {}

  private loadPrompt(filename: string): string {
    return readFileSync(join(__dirname, "..", "prompts", filename), "utf8");
  }

  private shortHash(input: unknown): string {
    return createHash("sha256")
      .update(typeof input === "string" ? input : JSON.stringify(input))
      .digest("hex")
      .slice(0, 10);
  }

  private async getCached<T>(key: string): Promise<T | null | undefined> {
    return await this.cache.get<T>(key);
  }

  private async setCached<T>(
    key: string,
    value: T,
    ttl: number
  ): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  private buildBlogPayload(blog: {
    store: { name: string; description: string | null };
    topic?: string | null;
    primaryKeyword?: string | null;
    products: Array<{ title: string; description: string | null }>;
    collections: Array<{ title: string; description: string | null }>;
  }) {
    return {
      store: {
        name: blog.store.name,
        description: blog.store.description ?? "",
      },
      blog: {
        ...(blog.topic && { topic: blog.topic }),
        ...(blog.primaryKeyword && { primaryKeyword: blog.primaryKeyword }),
      },
      products: blog.products.map((p) => ({
        name: p.title,
        description: p.description ?? "",
      })),
      collections: blog.collections.map((c) => ({
        name: c.title,
        description: c.description ?? "",
      })),
    };
  }

  async suggestTopic(blogId: string): Promise<string[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          products: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          collections: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.products.map((p) => p.id),
        blog.collections.map((c) => c.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:topics:${blog.store.id}:${sig}`;
      const cached = await this.getCached<string[]>(key);

      if (cached?.length) {
        return cached;
      }

      const payload = this.buildBlogPayload(blog);

      const res = await this.groq.chatJson<z.infer<typeof TopicsSchema>>({
        name: "topics",
        schema: TopicsSchema,
        messages: [
          { role: "system", content: this.loadPrompt("topics.md") },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.7,
      });

      const topics = Array.from(
        new Set(res.topics.map((t) => t.trim()))
      ).filter(Boolean);

      if (topics.length !== 5) {
        throw new Error(`Expected 5 topics, got ${topics.length}`);
      }

      await this.setCached(key, topics, TWO_DAYS_MS);
      return topics;
    } catch (e: any) {
      this.logger.error(
        `topics failed blog=${blogId}: ${e?.message}`,
        e?.stack
      );
      throw e;
    }
  }

  async suggestPrimaryKeyword(blogId: string): Promise<SuggestedKeyword[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          topic: true,
          products: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          collections: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.topic,
        blog.products.map((p) => p.id),
        blog.collections.map((c) => c.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:primary-keyword:${blog.store.id}:${sig}`;
      const cached = await this.getCached<SuggestedKeyword[]>(key);

      if (cached?.length) {
        return cached;
      }

      const payload = this.buildBlogPayload(blog);

      const { seeds } = await this.groq.chatJson<z.infer<typeof SeedSchema>>({
        name: "seeds",
        schema: SeedSchema,
        messages: [
          { role: "system", content: this.loadPrompt("seed.md") },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.7,
      });

      const suggestionTasks = seeds.map(async (seed) => {
        const task: KeywordSuggestionsTask = {
          keyword: seed,
          language_code: DATAFORSEO_LANGUAGE,
          location_code: DATAFORSEO_LOCATION,
          filters: [
            [
              ["keyword_info.search_volume", ">=", 40],
              "and",
              ["keyword_properties.keyword_difficulty", "<=", 50],
              "and",
              ["search_intent_info.main_intent", "<>", "navigational"],
            ],
          ],
          order_by: [
            "keyword_info.search_volume,desc",
            "keyword_properties.keyword_difficulty,asc",
          ],
          limit: 50,
        };

        const response = await this.dataForSeo.getKeywordSuggestions(task);
        const items = response.tasks?.[0]?.result?.[0]?.items ?? [];

        return items.map((item) => ({
          keyword: item.keyword,
          volume: item.keyword_info?.search_volume ?? 10,
          difficulty: item.keyword_properties?.keyword_difficulty ?? null,
          intent: item.search_intent_info?.main_intent ?? null,
        }));
      });

      const allKeywords = (await Promise.all(suggestionTasks)).flat();

      if (!allKeywords.length) {
        throw new Error(
          `No keyword suggestions returned for seeds: ${seeds.join(", ")}`
        );
      }

      const seen = new Set<string>();
      const uniqueKeywords = allKeywords.filter((kw) => {
        const normalized = kw.keyword.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });

      const keywordCandidates: KeywordCandidate[] = uniqueKeywords.map(
        (kw, index) => ({
          id: index + 1,
          ...kw,
        })
      );

      const primaryRes = await this.groq.chatJson<
        z.infer<typeof SelectedKeywordsSchema>
      >({
        name: "primary_keyword_selection",
        schema: SelectedKeywordsSchema,
        messages: [
          { role: "system", content: this.loadPrompt("primary-keywords.md") },
          {
            role: "user",
            content: JSON.stringify({
              ...payload,
              keywordCandidates,
            }),
          },
        ],
        temperature: 0.3,
        reasoningEffort: "low",
      });

      const byId = new Map(keywordCandidates.map((kw) => [kw.id, kw]));

      const keywords: SuggestedKeyword[] = primaryRes.items
        .map(({ id, recommended }) => {
          const base = byId.get(id);
          if (!base) {
            this.logger.warn(
              `primary-keyword missing_id blog=${blogId} id=${id}`
            );
            return null;
          }
          return { ...base, recommended };
        })
        .filter((x): x is SuggestedKeyword => x !== null);

      await this.setCached(key, keywords, ONE_DAY_MS);

      return keywords;
    } catch (e: any) {
      this.logger.error(
        `primary-keyword failed blog=${blogId}: ${e?.message}`,
        e?.stack
      );
      throw e;
    }
  }

  async suggestSecondaryKeywords(blogId: string): Promise<SuggestedKeyword[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          primaryKeyword: true,
          topic: true,
          products: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          collections: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.topic,
        blog.primaryKeyword,
        blog.products.map((p) => p.id),
        blog.collections.map((c) => c.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:secondary-keywords:${blog.store.id}:${sig}`;
      const cached = await this.getCached<SuggestedKeyword[]>(key);

      if (cached?.length) {
        return cached;
      }

      const task: KeywordIdeasTask = {
        keywords: [blog.primaryKeyword!],
        language_code: DATAFORSEO_LANGUAGE,
        location_code: DATAFORSEO_LOCATION,
        ignore_synonyms: false,
        closely_variants: false,
        filters: [
          [
            ["keyword_info.search_volume", ">=", 10],
            "and",
            ["keyword_properties.keyword_difficulty", "<=", 50],
            "and",
            ["search_intent_info.main_intent", "<>", "navigational"],
          ],
        ],
        order_by: [
          "keyword_info.search_volume,desc",
          "keyword_properties.keyword_difficulty,asc",
        ],
        limit: 500,
      };

      const response = await this.dataForSeo.getKeywordIdeas(task);
      const items = response.tasks?.[0]?.result?.[0]?.items ?? [];

      if (!items.length) {
        throw new Error(
          `No keyword ideas returned for primary keyword: ${blog.primaryKeyword}`
        );
      }

      const seen = new Set<string>();
      const uniqueItems = items.filter((item) => {
        const normalized = item.keyword.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });

      const keywordCandidates: KeywordCandidate[] = uniqueItems.map(
        (item, index) => ({
          id: index + 1,
          keyword: item.keyword,
          volume: item.keyword_info?.search_volume ?? 10,
          difficulty: item.keyword_properties?.keyword_difficulty ?? null,
          intent: item.search_intent_info?.main_intent ?? null,
        })
      );

      const payload = this.buildBlogPayload(blog);

      const secondaryRes = await this.groq.chatJson<
        z.infer<typeof SelectedKeywordsSchema>
      >({
        name: "secondary_keyword_selection",
        schema: SelectedKeywordsSchema,
        messages: [
          { role: "system", content: this.loadPrompt("secondary-keywords.md") },
          {
            role: "user",
            content: JSON.stringify({
              ...payload,
              keywordCandidates,
            }),
          },
        ],
        temperature: 0.3,
        reasoningEffort: "low",
      });

      const byId = new Map(keywordCandidates.map((kw) => [kw.id, kw]));

      const suggestedKeywords: SuggestedKeyword[] = secondaryRes.items
        .map(({ id, recommended }) => {
          const base = byId.get(id);
          if (!base) {
            this.logger.warn(
              `secondary-keywords missing_id blog=${blogId} id=${id}`
            );
            return null;
          }
          return { ...base, recommended };
        })
        .filter((x): x is SuggestedKeyword => x !== null);

      await this.setCached(key, suggestedKeywords, TWO_DAYS_MS);

      return suggestedKeywords;
    } catch (e: any) {
      this.logger.error(
        `secondary-keywords failed blog=${blogId}: ${e?.message}`,
        e?.stack
      );
      throw e;
    }
  }
}
