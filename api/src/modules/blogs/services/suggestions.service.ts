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
  RelatedKeywordsTask,
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
        `primary-keyword blog=${blogId} store=${blog.store.name} topic="${blog.topic}" intent=${blog.searchIntent} persona=${blog.targetPersona} products=${blog.products.length} collections=${blog.collections.length}`,
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
          `primary-keyword hit blog=${blogId} sig=${sig} suggested_len=${cached.length}`,
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

      const { seed } = await this.groq.chatJson<z.infer<typeof SeedSchema>>({
        name: "seed",
        schema: SeedSchema,
        messages: [
          { role: "system", content: this.loadPrompt("seed.md") },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.7,
      });

      this.logger.debug(
        `primary-keyword seed blog=${blogId} topic="${blog.topic}" seed="${seed}"`,
      );

      const baseTask: RelatedKeywordsTask = {
        keyword: seed,
        language_name: "English",
        location_code: 2840,
        filters: [
          [
            ["keyword_data.keyword_info.search_volume", ">=", 20],
            "and",
            ["keyword_data.keyword_properties.keyword_difficulty", "<=", 70],
          ],
        ],
        order_by: [
          "keyword_data.keyword_info.search_volume,desc",
          "keyword_data.keyword_properties.keyword_difficulty,asc",
        ],
        limit: 100,
        depth: 2,
      };

      const normalizeVolume = (v: number | undefined | null, bumpZero: boolean) => {
        const value = v ?? 0;
        if (bumpZero && value === 0) return 10;
        return value;
      };

      let relatedKeywords: KeywordCandidate[] | null = null;
      let phase: 1 | 2 | 3 | null = null;

      const phase1Response = await this.dataForSeo.getRelatedKeywords(baseTask);
      const phase1Task = phase1Response.tasks?.[0] ?? null;
      const phase1Result = phase1Task?.result?.[0] ?? null;
      const phase1Items = phase1Result?.items ?? [];
      this.logger.debug(
        `primary-keyword dfseo phase=1 blog=${blogId} seed="${seed}" tasks_len=${phase1Response.tasks?.length ?? 0} items_len=${phase1Items.length}`,
      );

      if (phase1Items.length > 0) {
        relatedKeywords = phase1Items.map((i, idx) => ({
          id: idx,
          keyword: i.keyword_data.keyword,
          volume: normalizeVolume(
            i.keyword_data.keyword_info?.search_volume,
            false,
          ),
          difficulty:
            i.keyword_data.keyword_properties?.keyword_difficulty ?? null,
          intent: i.keyword_data.search_intent_info?.main_intent ?? null,
        }));
        phase = 1;
      } else {
        this.logger.warn(
          `primary-keyword phase=1 empty blog=${blogId} seed="${seed}" relaxing filters`,
        );

        const relaxedTask: RelatedKeywordsTask = {
          ...baseTask,
          filters: [
            [
              [
                "keyword_data.keyword_properties.keyword_difficulty",
                "<=",
                80,
              ],
            ],
          ],
        };

        const phase2Response =
          await this.dataForSeo.getRelatedKeywords(relaxedTask);
        const phase2Task = phase2Response.tasks?.[0] ?? null;
        const phase2Result = phase2Task?.result?.[0] ?? null;
        const phase2Items = phase2Result?.items ?? [];
        this.logger.debug(
          `primary-keyword dfseo phase=2 blog=${blogId} seed="${seed}" tasks_len=${phase2Response.tasks?.length ?? 0} items_len=${phase2Items.length}`,
        );

        if (phase2Items.length > 0) {
          relatedKeywords = phase2Items.map((i, idx) => ({
            id: idx,
            keyword: i.keyword_data.keyword,
            volume: normalizeVolume(
              i.keyword_data.keyword_info?.search_volume,
              true,
            ),
            difficulty:
              i.keyword_data.keyword_properties?.keyword_difficulty ?? null,
            intent: i.keyword_data.search_intent_info?.main_intent ?? null,
          }));
          phase = 2;
        } else {
          this.logger.warn(
            `primary-keyword phase=2 empty blog=${blogId} seed="${seed}" falling back to keyword_ideas`,
          );

          const ideasTask: KeywordIdeasTask = {
            keywords: [seed],
            language_name: "English",
            location_code: 2840,
            filters: [
              [
                ["keyword_info.search_volume", ">=", 0],
                "and",
                ["keyword_properties.keyword_difficulty", "<=", 80],
              ],
            ],
            order_by: [
              "relevance,desc",
              "keyword_info.search_volume,desc",
            ],
            limit: 100,
          };

          const ideasResponse =
            await this.dataForSeo.getKeywordIdeas(ideasTask);
          const ideasTask0 = ideasResponse.tasks?.[0] ?? null;
          const ideasResult = ideasTask0?.result?.[0] ?? null;
          const ideasItems = ideasResult?.items ?? [];
          this.logger.debug(
            `primary-keyword dfseo phase=3 blog=${blogId} seed="${seed}" tasks_len=${ideasResponse.tasks?.length ?? 0} items_len=${ideasItems.length}`,
          );

          if (ideasItems.length > 0) {
            relatedKeywords = ideasItems.map((i, idx) => ({
              id: idx,
              keyword: i.keyword,
              volume: normalizeVolume(
                i.keyword_info?.search_volume,
                true,
              ),
              difficulty:
                i.keyword_properties?.keyword_difficulty ?? null,
              intent: i.search_intent_info?.main_intent ?? null,
            }));
            phase = 3;
          }
        }
      }

      if (!relatedKeywords || relatedKeywords.length === 0 || phase === null) {
        throw new Error(
          "no keywords returned from related_keywords or keyword_ideas",
        );
      }

      this.logger.debug(
        `primary-keyword related blog=${blogId} seed="${seed}" phase=${phase} related_len=${relatedKeywords.length}`,
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
              relatedKeywords,
            }),
          },
        ],
        temperature: 0.3,
      });

      this.logger.debug(
        `primary-keyword llm-items blog=${blogId} seed="${seed}" llm_items_len=${primaryRes.items.length}`,
      );

      const byId = new Map<number, KeywordCandidate>();
      for (const kw of relatedKeywords) {
        byId.set(kw.id, kw);
      }

      const suggestedKeywords: SuggestedKeyword[] = primaryRes.items
        .map(({ id, recommended }) => {
          const base = byId.get(id);
          if (!base) {
            this.logger.debug(
              `primary-keyword missing-id blog=${blogId} id=${id}`,
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
        `primary-keyword suggested blog=${blogId} seed="${seed}" phase=${phase} suggested_len=${suggestedKeywords.length}`,
      );

      await this.cache.set(key, suggestedKeywords, TWO_DAYS_MS);
      this.logger.debug(`primary-keyword cached blog=${blogId} sig=${sig}`);

      return suggestedKeywords;
    } catch (e: any) {
      this.logger.error(
        `primary-keyword error blog=${blogId}: ${e?.message}`,
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
        `secondary-keywords blog=${blogId} store=${blog.store.name} topic="${blog.topic}" primary="${blog.primaryKeyword}" intent=${blog.searchIntent} persona=${blog.targetPersona} products=${blog.products.length} collections=${blog.collections.length}`,
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
          `secondary-keywords hit blog=${blogId} sig=${sig} suggested_len=${cached.length}`,
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

      const seedPayload = {
        store: payload.store,
        blog: {
          targetPersona: blog.targetPersona,
          searchIntent: "INFORMATIONAL",
          topic: blog.topic,
          primaryKeyword: blog.primaryKeyword,
        },
        products: payload.products,
        collections: payload.collections,
      };

      const { seed } = await this.groq.chatJson<z.infer<typeof SeedSchema>>({
        name: "seed_secondary",
        schema: SeedSchema,
        messages: [
          { role: "system", content: this.loadPrompt("seed.md") },
          { role: "user", content: JSON.stringify(seedPayload) },
        ],
        temperature: 0.7,
      });

      this.logger.debug(
        `secondary-keywords seed blog=${blogId} topic="${blog.topic}" primary="${blog.primaryKeyword}" seed="${seed}" forced_intent=INFORMATIONAL`,
      );

      const baseTask: RelatedKeywordsTask = {
        keyword: seed,
        language_name: "English",
        location_code: 2840,
        filters: [
          [
            ["keyword_data.keyword_info.search_volume", ">=", 10],
            "and",
            ["keyword_data.keyword_properties.keyword_difficulty", "<=", 80],
          ],
        ],
        order_by: [
          "keyword_data.keyword_info.search_volume,desc",
          "keyword_data.keyword_properties.keyword_difficulty,asc",
        ],
        limit: 200,
        depth: 2,
      };

      const normalizeVolume = (v: number | undefined | null, bumpZero: boolean) => {
        const value = v ?? 0;
        if (bumpZero && value === 0) return 10;
        return value;
      };

      let relatedKeywords: KeywordCandidate[] | null = null;
      let phase: 1 | 2 | 3 | null = null;

      const phase1Response = await this.dataForSeo.getRelatedKeywords(baseTask);
      const phase1Task = phase1Response.tasks?.[0] ?? null;
      const phase1Result = phase1Task?.result?.[0] ?? null;
      const phase1Items = phase1Result?.items ?? [];
      this.logger.debug(
        `secondary-keywords dfseo phase=1 blog=${blogId} seed="${seed}" tasks_len=${phase1Response.tasks?.length ?? 0} items_len=${phase1Items.length}`,
      );

      if (phase1Items.length > 0) {
        relatedKeywords = phase1Items.map((i, idx) => ({
          id: idx,
          keyword: i.keyword_data.keyword,
          volume: normalizeVolume(
            i.keyword_data.keyword_info?.search_volume,
            false,
          ),
          difficulty:
            i.keyword_data.keyword_properties?.keyword_difficulty ?? null,
          intent: i.keyword_data.search_intent_info?.main_intent ?? null,
        }));
        phase = 1;
      } else {
        this.logger.warn(
          `secondary-keywords phase=1 empty blog=${blogId} seed="${seed}" relaxing filters`,
        );

        const relaxedTask: RelatedKeywordsTask = {
          ...baseTask,
          filters: [
            [
              [
                "keyword_data.keyword_properties.keyword_difficulty",
                "<=",
                80,
              ],
            ],
          ],
        };

        const phase2Response =
          await this.dataForSeo.getRelatedKeywords(relaxedTask);
        const phase2Task = phase2Response.tasks?.[0] ?? null;
        const phase2Result = phase2Task?.result?.[0] ?? null;
        const phase2Items = phase2Result?.items ?? [];
        this.logger.debug(
          `secondary-keywords dfseo phase=2 blog=${blogId} seed="${seed}" tasks_len=${phase2Response.tasks?.length ?? 0} items_len=${phase2Items.length}`,
        );

        if (phase2Items.length > 0) {
          relatedKeywords = phase2Items.map((i, idx) => ({
            id: idx,
            keyword: i.keyword_data.keyword,
            volume: normalizeVolume(
              i.keyword_data.keyword_info?.search_volume,
              true,
            ),
            difficulty:
              i.keyword_data.keyword_properties?.keyword_difficulty ?? null,
            intent: i.keyword_data.search_intent_info?.main_intent ?? null,
          }));
          phase = 2;
        } else {
          this.logger.warn(
            `secondary-keywords phase=2 empty blog=${blogId} seed="${seed}" falling back to keyword_ideas`,
          );

          const ideasTask: KeywordIdeasTask = {
            keywords: [seed],
            language_name: "English",
            location_code: 2840,
            filters: [
              [
                ["keyword_info.search_volume", ">=", 0],
                "and",
                ["keyword_properties.keyword_difficulty", "<=", 80],
              ],
            ],
            order_by: [
              "relevance,desc",
              "keyword_info.search_volume,desc",
            ],
            limit: 200,
          };

          const ideasResponse =
            await this.dataForSeo.getKeywordIdeas(ideasTask);
          const ideasTask0 = ideasResponse.tasks?.[0] ?? null;
          const ideasResult = ideasTask0?.result?.[0] ?? null;
          const ideasItems = ideasResult?.items ?? [];
          this.logger.debug(
            `secondary-keywords dfseo phase=3 blog=${blogId} seed="${seed}" tasks_len=${ideasResponse.tasks?.length ?? 0} items_len=${ideasItems.length}`,
          );

          if (ideasItems.length > 0) {
            relatedKeywords = ideasItems.map((i, idx) => ({
              id: idx,
              keyword: i.keyword,
              volume: normalizeVolume(
                i.keyword_info?.search_volume,
                true,
              ),
              difficulty:
                i.keyword_properties?.keyword_difficulty ?? null,
              intent: i.search_intent_info?.main_intent ?? null,
            }));
            phase = 3;
          }
        }
      }

      if (!relatedKeywords || relatedKeywords.length === 0 || phase === null) {
        throw new Error(
          "no keywords returned from related_keywords or keyword_ideas",
        );
      }

      this.logger.debug(
        `secondary-keywords related blog=${blogId} seed="${seed}" phase=${phase} related_len=${relatedKeywords.length}`,
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
              relatedKeywords,
            }),
          },
        ],
        temperature: 0.3,
      });

      this.logger.debug(
        `secondary-keywords llm-items blog=${blogId} seed="${seed}" phase=${phase} llm_items_len=${secondaryRes.items.length}`,
      );

      const byId = new Map<number, KeywordCandidate>();
      for (const kw of relatedKeywords) {
        byId.set(kw.id, kw);
      }

      const suggestedKeywords: SuggestedKeyword[] = secondaryRes.items
        .map(({ id, recommended }) => {
          const base = byId.get(id);
          if (!base) {
            this.logger.debug(
              `secondary-keywords missing-id blog=${blogId} id=${id}`,
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
        `secondary-keywords suggested blog=${blogId} seed="${seed}" phase=${phase} suggested_len=${suggestedKeywords.length}`,
      );

      await this.cache.set(key, suggestedKeywords, TWO_DAYS_MS);
      this.logger.debug(`secondary-keywords cached blog=${blogId} sig=${sig}`);

      return suggestedKeywords;
    } catch (e: any) {
      this.logger.error(
        `secondary-keywords error blog=${blogId}: ${e?.message}`,
        e?.stack,
      );
      throw e;
    }
  }

}
