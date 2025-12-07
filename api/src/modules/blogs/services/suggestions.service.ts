import { createHash } from "crypto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { z } from "zod";

import { GroqClient } from "@/clients/groq/groq.client";
import { PrismaService } from "@/clients/prisma/prisma.service";

import { TopicsSchema, SeedSchema, KeywordsSchema } from "../schemas";
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
const CACHE_NS = "suggestions";
const CACHE_V = "v1";

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

  private shortHash(input: unknown) {
    return createHash("sha256")
      .update(typeof input === "string" ? input : JSON.stringify(input))
      .digest("hex")
      .slice(0, 10);
  }

  async suggestTopic(blogId: string): Promise<string[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          searchIntent: true,
          targetPersona: true,
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

      this.logger.debug(
        `topics blog=${blogId} store=${blog.store.name} intent=${blog.searchIntent} persona=${blog.targetPersona} products=${blog.products.length} collections=${blog.collections.length}`
      );

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.targetPersona,
        blog.searchIntent,
        blog.products.map((p) => p.id),
        blog.collections.map((c) => c.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:topics:${blog.store.id}:${sig}`;

      const cached = await this.cache.get<string[]>(key);
      if (cached?.length) {
        this.logger.debug(
          `topics hit blog=${blogId} sig=${sig} topics_len=${cached.length}`
        );
        return cached;
      }
      this.logger.debug(`topics miss blog=${blogId} sig=${sig}`);

      const payload = {
        store: {
          name: blog.store.name,
          description: blog.store.description,
        },
        blog: {
          targetPersona: blog.targetPersona,
          searchIntent: blog.searchIntent,
        },
        products: blog.products.map((p) => ({
          name: p.title,
          description: p.description,
        })),
        collections: blog.collections.map((c) => ({
          name: c.title,
          description: c.description,
        })),
      };

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

      this.logger.debug(
        `topics generated blog=${blogId} raw_len=${res.topics.length} dedup_len=${topics.length}`
      );

      if (topics.length !== 5) {
        this.logger.warn(`topics invalid len=${topics.length} blog=${blogId}`);
        throw new Error("invalid topics length");
      }

      await this.cache.set(key, topics, TWO_DAYS_MS);
      this.logger.debug(`topics cached blog=${blogId} sig=${sig}`);
      return topics;
    } catch (e: any) {
      this.logger.error(`topics error blog=${blogId}: ${e?.message}`, e?.stack);
      throw e;
    }
  }

  async suggestPrimaryKeyword(blogId: string): Promise<SuggestedKeyword[]> {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          searchIntent: true,
          targetPersona: true,
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

      this.logger.debug(
        `primary-keyword blog=${blogId} store=${blog.store.name} topic="${blog.topic}" intent=${blog.searchIntent} persona=${blog.targetPersona} products=${blog.products.length} collections=${blog.collections.length}`
      );

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.topic,
        blog.targetPersona,
        blog.searchIntent,
        blog.products.map((p) => p.id),
        blog.collections.map((c) => c.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:primary-keyword:${blog.store.id}:${sig}`;

      const cached = await this.cache.get<SuggestedKeyword[]>(key);
      if (cached?.length) {
        this.logger.debug(
          `primary-keyword hit blog=${blogId} sig=${sig} suggested_len=${cached.length}`
        );
        return cached;
      }
      this.logger.debug(`primary-keyword miss blog=${blogId} sig=${sig}`);

      const payload = {
        store: {
          name: blog.store.name,
          description: blog.store.description,
        },
        blog: {
          targetPersona: blog.targetPersona,
          searchIntent: blog.searchIntent,
          topic: blog.topic,
        },
        products: blog.products.map((p) => ({
          name: p.title,
          description: p.description,
        })),
        collections: blog.collections.map((c) => ({
          name: c.title,
          description: c.description,
        })),
      };

      const { seeds } = await this.groq.chatJson<z.infer<typeof SeedSchema>>({
        name: "seed",
        schema: SeedSchema,
        messages: [
          { role: "system", content: this.loadPrompt("seed.md") },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.7,
        reasoningEffort: 'low'
      });

      this.logger.debug(
        `primary-keyword seed blog=${blogId} topic="${blog.topic}" seeds="${seeds}"`
      );

      const suggestionTasks: KeywordSuggestionsTask[] = seeds.map((seed) => ({
        keyword: seed,
        language_name: "English",
        location_code: 2840,
        exact_match: false,
        ignore_synonyms: false,
        filters: [
          [
            ["keyword_info.search_volume", ">=", 50],
            "and",
            ["keyword_info.search_volume", "<=", 3000],
            "and",
            ["keyword_properties.keyword_difficulty", "<=", 60],
            "and",
            ["search_intent_info.main_intent", "<>", "transactional"],
            "and",
            ["search_intent_info.main_intent", "<>", "navigational"],
          ],
        ],
        order_by: [
          "keyword_info.search_volume,desc",
          "keyword_properties.keyword_difficulty,asc",
        ],
        limit: 50,
      }));

      const responses = await Promise.all(
        suggestionTasks.map((task) =>
          this.dataForSeo.getKeywordSuggestions(task)
        )
      );

      const allItems =
        responses.flatMap((res) => res.tasks?.[0]?.result?.[0]?.items ?? []) ??
        [];

      const seen = new Set<string>();
      const rawKeywords = allItems.filter((item) => {
        const k = item.keyword.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (!rawKeywords.length) {
        throw new Error("no keywords returned from keyword_suggestions");
      }

      const keywordCandidates: KeywordCandidate[] = rawKeywords.map(
        (item, index) => ({
          id: index + 1,
          keyword: item.keyword,
          volume: item.keyword_info?.search_volume ?? 10,
          difficulty: item.keyword_properties?.keyword_difficulty ?? null,
          intent: item.search_intent_info?.main_intent ?? null,
        })
      );

      this.logger.debug(
        `primary-keyword suggested blog=${blogId} seeds="${seeds}" related_len=${keywordCandidates.length}`
      );

      const primaryRes = await this.groq.chatJson<
        z.infer<typeof KeywordsSchema>
      >({
        name: "primary_keywords",
        schema: KeywordsSchema,
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
        reasoningEffort: 'low'
      });

      this.logger.debug(
        `primary-keyword llm-items blog=${blogId} seeds="${seeds}" llm_items_len=${primaryRes.items.length}`
      );

      const byId = new Map<number, KeywordCandidate>();
      for (const kw of keywordCandidates) {
        byId.set(kw.id, kw);
      }

      const suggestedKeywords: SuggestedKeyword[] = primaryRes.items
        .map(({ id, recommended }) => {
          const base = byId.get(id);
          if (!base) {
            this.logger.debug(
              `primary-keyword missing-id blog=${blogId} id=${id}`
            );
            return null;
          }
          return {
            ...base,
            recommended,
          };
        })
        .filter((x): x is SuggestedKeyword => x !== null);

      this.logger.debug(
        `primary-keyword suggested blog=${blogId} seeds="${seeds}"suggested_len=${suggestedKeywords.length}`
      );

      await this.cache.set(key, suggestedKeywords, TWO_DAYS_MS);
      this.logger.debug(`primary-keyword cached blog=${blogId} sig=${sig}`);

      return suggestedKeywords;
    } catch (e: any) {
      this.logger.error(
        `primary-keyword error blog=${blogId}: ${e?.message}`,
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
          searchIntent: true,
          targetPersona: true,
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

      this.logger.debug(
        `secondary-keywords blog=${blogId} store=${blog.store.name} topic="${blog.topic}" primary="${blog.primaryKeyword}" intent=${blog.searchIntent} persona=${blog.targetPersona} products=${blog.products.length} collections=${blog.collections.length}`
      );

      const sig = this.shortHash([
        blog.store.name,
        blog.store.description,
        blog.topic,
        blog.primaryKeyword,
        blog.targetPersona,
        blog.searchIntent,
        blog.products.map((p) => p.id),
        blog.collections.map((c) => c.id),
      ]);

      const key = `${CACHE_NS}:${CACHE_V}:secondary-keywords:${blog.store.id}:${sig}`;

      const cached = await this.cache.get<SuggestedKeyword[]>(key);
      if (cached?.length) {
        this.logger.debug(
          `secondary-keywords hit blog=${blogId} sig=${sig} suggested_len=${cached.length}`
        );
        return cached;
      }
      this.logger.debug(`secondary-keywords miss blog=${blogId} sig=${sig}`);

      const payload = {
        store: {
          name: blog.store.name,
          description: blog.store.description,
        },
        blog: {
          targetPersona: blog.targetPersona,
          searchIntent: blog.searchIntent,
          topic: blog.topic,
          primaryKeyword: blog.primaryKeyword,
        },
        products: blog.products.map((p) => ({
          name: p.title,
          description: p.description,
        })),
        collections: blog.collections.map((c) => ({
          name: c.title,
          description: c.description,
        })),
      };

      const task: KeywordIdeasTask = {
        keywords: [blog.primaryKeyword!],
        language_name: "English",
        location_code: 2840,
        ignore_synonyms: false,
        closely_variants: false,
        filters: [
          [
            ["keyword_info.search_volume", ">=", 50],
            "and",
            ["keyword_info.search_volume", "<=", 5000],
            "and",
            ["keyword_properties.keyword_difficulty", "<=", 60],
            "and",
            ["search_intent_info.main_intent", "<>", "transactional"],
            "and",
            ["search_intent_info.main_intent", "<>", "navigational"],
          ],
        ],
        order_by: [
          "keyword_info.search_volume,desc",
          "keyword_properties.keyword_difficulty,asc",
        ],
        limit: 300,
      };

      const response = await this.dataForSeo.getKeywordIdeas(task)
      const items = response.tasks?.[0]?.result?.[0]?.items ?? []

      const seen = new Set<string>();
      const rawKeywords = items.filter((item) => {
        const k = item.keyword.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (!rawKeywords.length) {
        throw new Error("no keywords returned from keyword_suggestions");
      }

      const keywordCandidates: KeywordCandidate[] = rawKeywords.map(
        (item, index) => ({
          id: index + 1,
          keyword: item.keyword,
          volume: item.keyword_info?.search_volume ?? 10,
          difficulty: item.keyword_properties?.keyword_difficulty ?? null,
          intent: item.search_intent_info?.main_intent ?? null,
        })
      );

      this.logger.debug(
        `secondary-keyword suggested blog=${blogId} seed="${blog.primaryKeyword}" related_len=${keywordCandidates.length}`
      );

      const secondaryRes = await this.groq.chatJson<
        z.infer<typeof KeywordsSchema>
      >({
        name: "secondary_keywords",
        schema: KeywordsSchema,
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
        reasoningEffort: 'low'
      });

      this.logger.debug(
        `secondary-keyword llm-items blog=${blogId} seed="${blog.primaryKeyword}" llm_items_len=${secondaryRes.items.length}`
      );

      const byId = new Map<number, KeywordCandidate>();
      for (const kw of keywordCandidates) {
        byId.set(kw.id, kw);
      }

      const suggestedKeywords: SuggestedKeyword[] = secondaryRes.items
        .map(({ id, recommended }) => {
          const base = byId.get(id);
          if (!base) {
            this.logger.debug(
              `secondary-keyword missing-id blog=${blogId} id=${id}`
            );
            return null;
          }
          return {
            ...base,
            recommended,
          };
        })
        .filter((x): x is SuggestedKeyword => x !== null);

      this.logger.debug(
        `secondary-keyword suggested blog=${blogId} seed="${blog.primaryKeyword}"suggested_len=${suggestedKeywords.length}`
      );

      await this.cache.set(key, suggestedKeywords, TWO_DAYS_MS);
      this.logger.debug(`secondary-keyword cached blog=${blogId} sig=${sig}`);

      return suggestedKeywords;
    } catch (e: any) {
      this.logger.error(
        `secondary-keywords error blog=${blogId}: ${e?.message}`,
        e?.stack
      );
      throw e;
    }
  }
}
