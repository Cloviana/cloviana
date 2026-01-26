import { createHash } from "crypto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { z } from "zod";

import { GroqClient } from "@/clients/groq/groq.client";
import { PrismaService } from "@/clients/prisma/prisma.service";

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import {
  KeywordIdeasTask,
  KeywordSuggestionsTask,
} from "@/integrations/dataforseo/dataforseo.types";
import type {
  KeywordCandidate,
  SuggestedKeyword,
} from "@/modules/blogs/types/suggestions.types";
import { SeedSchema, SelectedKeywordsSchema, TopicsSchema } from "../schemas";

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
    private readonly dataForSeo: DataForSeoService,
  ) {}

  private shortHash(input: unknown): string {
    return createHash("sha256")
      .update(typeof input === "string" ? input : JSON.stringify(input))
      .digest("hex")
      .slice(0, 10);
  }

  private async getCached<T>(key: string): Promise<T | null | undefined> {
    return await this.cache.get<T>(key);
  }

  private normalizeKeyword(raw: string): string {
    return raw.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  }

  private dedupeByKeyword<T extends { keyword: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of items) {
      const normalized = this.normalizeKeyword(item.keyword);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(item);
    }

    return result;
  }

  private async setCached<T>(
    key: string,
    value: T,
    ttl: number,
  ): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async suggestTopic(blogId: string): Promise<string[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          contentType: true,
          products: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          store: {
            select: {
              id: true,
            },
          },
        },
      });

      const sig = this.shortHash([
        blog.contentType,
        blog.products.map((p) => p.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:topics:${blog.store.id}:${sig}`;
      const cached = await this.getCached<string[]>(key);
      if (cached?.length) return cached;

      const systemPrompt = await loadPromptHbs(
        "topics",
        {
          blog: { contentType: blog.contentType },
        },
        {
          baseDir: join(__dirname, "..", "prompts"),
          ext: ".hbs",
          helpers: {
            eq: (a: any, b: any) => a === b,
          },
        },
      );

      const res = await this.groq.chatJson<z.infer<typeof TopicsSchema>>({
        name: "topics",
        model: "openai/gpt-oss-20b",
        schema: TopicsSchema,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({ products: blog.products }),
          },
        ],
        temperature: 0.7,
      });

      const topics = Array.from(
        new Set(res.topics.map((t) => t.trim())),
      ).filter(Boolean);

      if (topics.length !== 5) {
        throw new Error(`Expected 5 topics, got ${topics.length}`);
      }

      await this.setCached(key, topics, TWO_DAYS_MS);
      return topics;
    } catch (e: any) {
      this.logger.error(
        `topics failed blog=${blogId}: ${e?.message}`,
        e?.stack,
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
          contentType: true,
          topic: true,
          products: {
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
        blog.contentType,
        blog.topic,
        blog.store.name,
        blog.store.description,
        blog.products.map((p) => p.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:primary-keyword:${blog.store.id}:${sig}`;
      const cached = await this.getCached<SuggestedKeyword[]>(key);
      if (cached?.length) return cached;

      const seedPrompt = await loadPromptHbs(
        "seed",
        { blog: { contentType: blog.contentType } },
        {
          baseDir: join(__dirname, "..", "prompts"),
          ext: ".hbs",
          helpers: { eq: (a: any, b: any) => a === b },
        },
      );

      const seedInput = {
        store: {
          name: blog.store.name,
          description: blog.store.description ?? "",
        },
        blog: {
          contentType: blog.contentType,
          topic: blog.topic ?? null,
        },
        products: blog.products.map((p) => ({
          title: p.title,
          description: p.description ?? "",
        })),
      };

      const { seeds } = await this.groq.chatJson<z.infer<typeof SeedSchema>>({
        name: "seeds",
        schema: SeedSchema,
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: seedPrompt },
          { role: "user", content: JSON.stringify(seedInput) },
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
          `No keyword suggestions returned for seeds: ${seeds.join(", ")}`,
        );
      }

      const uniqueKeywords = this.dedupeByKeyword(allKeywords);

      const keywordCandidates: KeywordCandidate[] = uniqueKeywords.map(
        (kw, index) => ({
          id: index + 1,
          ...kw,
        }),
      );

      const primaryPrompt = await loadPromptHbs(
        "primary-keywords",
        { blog: { contentType: blog.contentType } },
        {
          baseDir: join(__dirname, "..", "prompts"),
          ext: ".hbs",
          helpers: { eq: (a: any, b: any) => a === b },
        },
      );

      const primaryInput = {
        store: seedInput.store,
        blog: seedInput.blog,
        products: seedInput.products,
        keywordCandidates,
      };

      const primaryRes = await this.groq.chatJson<
        z.infer<typeof SelectedKeywordsSchema>
      >({
        name: "primary_keyword_selection",
        schema: SelectedKeywordsSchema,
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: primaryPrompt },
          { role: "user", content: JSON.stringify(primaryInput) },
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
              `primary-keyword missing_id blog=${blogId} id=${id}`,
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
        e?.stack,
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
          topic: true,
          primaryKeyword: true,
          products: {
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

      if (!blog.primaryKeyword) {
        throw new Error(`Primary keyword is missing for blog: ${blogId}`);
      }

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.topic,
        blog.primaryKeyword,
        blog.products.map((p) => p.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:secondary-keywords:${blog.store.id}:${sig}`;
      const cached = await this.getCached<SuggestedKeyword[]>(key);
      if (cached?.length) return cached;

      const task: KeywordIdeasTask = {
        keywords: [blog.primaryKeyword],
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
          `No keyword ideas returned for primary keyword: ${blog.primaryKeyword}`,
        );
      }

      const dedupedItems = this.dedupeByKeyword(items);

      const keywordCandidates: KeywordCandidate[] = dedupedItems.map(
        (item, index) => ({
          id: index + 1,
          keyword: item.keyword,
          volume: item.keyword_info?.search_volume ?? 10,
          difficulty: item.keyword_properties?.keyword_difficulty ?? null,
          intent: item.search_intent_info?.main_intent ?? null,
        }),
      );

      const secondaryPrompt = await loadPromptHbs(
        "secondary-keywords",
        {},
        {
          baseDir: join(__dirname, "..", "prompts"),
          ext: ".hbs",
        },
      );

      const secondaryInput = {
        store: {
          name: blog.store.name,
          description: blog.store.description ?? "",
        },
        blog: {
          topic: blog.topic ?? null,
          primaryKeyword: blog.primaryKeyword,
        },
        products: blog.products.map((p) => ({
          title: p.title,
          description: p.description ?? "",
        })),
        keywordCandidates,
      };

      const secondaryRes = await this.groq.chatJson<
        z.infer<typeof SelectedKeywordsSchema>
      >({
        name: "secondary_keyword_selection",
        schema: SelectedKeywordsSchema,
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: secondaryPrompt },
          { role: "user", content: JSON.stringify(secondaryInput) },
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
              `secondary-keywords missing_id blog=${blogId} id=${id}`,
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
        e?.stack,
      );
      throw e;
    }
  }
}
