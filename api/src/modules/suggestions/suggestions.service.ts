import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import Groq from "groq-sdk";
import { PrismaService } from "@/clients/prisma/prisma.service";
import pRetry from "p-retry";
import { SerankingMetricsService } from "@/modules/seranking/services/seranking.metrics.service";
import { type KeywordSuggestion } from "@/modules/suggestions/suggestions.types";
import { SerpIntent } from "@/modules/seranking/seranking.types";

@Injectable()
export class SuggestionsService {
  private readonly groq = new Groq();
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly metrics: SerankingMetricsService,
    private readonly prisma: PrismaService
  ) {}

  async suggestTopic(storeId: string): Promise<string[]> {
    const key = `suggestions:topics:${storeId}`;
    const cached = await this.cache.get<string[]>(key);
    if (cached?.length) {
      this.logger.debug(`Cache hit for store ${storeId}`);
      return cached;
    }

    this.logger.debug(
      `Cache miss for store ${storeId}, fetching store data...`
    );
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

    const system = [
      "You are an SEO assistant for an e-commerce blog. Propose 5 concise blog TOPICS, not titles.",
      "A topic is a subject area, not a headline. Avoid clickbait, branding, and punctuation like ! or ?",
      "Make topics specific, evergreen, and aligned to the store description and products. Prefer 4–10 words each.",
      "Examples:",
      "• Natural remedies for glowing skin",
      "• Top DIY face masks for different skin types",
      "• Essential oils for skincare: Benefits and uses",
      "• How to create a personalized skincare routine",
      "Return exactly 5 topics.",
    ].join("\n");

    const userPayload = {
      store: {
        name: store.name,
        description: store.description ?? "",
        products: store.products.map((p) => ({
          title: p.title,
          description: p.description ?? "",
        })),
      },
    };

    const topics = await pRetry(
      async () => {
        this.logger.debug(
          `Requesting topics from Groq for store ${storeId}...`
        );
        const completion = await this.groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "seo_topics",
              schema: {
                type: "object",
                properties: {
                  topics: {
                    type: "array",
                    minItems: 5,
                    maxItems: 5,
                    items: { type: "string" },
                  },
                },
                required: ["topics"],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.7,
        });

        const content = completion.choices?.[0]?.message?.content ?? "";
        this.logger.debug(`Groq response for store ${storeId}: ${content}`);

        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed?.topics)
          ? (parsed.topics as string[])
          : [];
        const normalized = Array.from(
          new Set(list.map((t) => String(t).trim()))
        ).filter(Boolean);
        if (normalized.length !== 5) {
          this.logger.warn(
            `Invalid topics count for store ${storeId}: ${normalized.length}`
          );
          throw new Error("invalid topics");
        }
        return normalized;
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.error(
            `Attempt ${error.attemptNumber} failed for store ${storeId}: ${error.message}`
          );
        },
      }
    );

    this.logger.debug(`Caching topics for store ${storeId}`);
    await this.cache.set(key, topics, 60 * 60 * 24 * 1000 * 2);
    return topics;
  }

  async suggestPrimaryKeyword(topic: string): Promise<KeywordSuggestion[]> {
    const cacheKey = `suggestions:primary:${topic}`;
    this.logger.debug(`Cache lookup for ${cacheKey}`);
    const cached = await this.cache.get<KeywordSuggestion[]>(cacheKey);
    if (cached?.length) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss for ${cacheKey}, requesting seed...`);
    const seed = await pRetry(
      async () => {
        const completion = await this.groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: `
                Generate exactly one short SEO seed keyword for the topic.
                The seed must:
                - Be 1–2 words only (a head term, noun, or noun phrase)
                - Contain only letters, numbers, and spaces (no punctuation or special characters)
                - Avoid prepositions or descriptive phrases like "for casual comfort"
                - Prefer the most common or generic variant of the topic (e.g., "breathable fabric", "cotton", "linen")
                - If the topic combines an attribute and a category, focus on the attribute alone or the category alone
                - Output JSON only.
              `,
            },
            { role: "user", content: JSON.stringify({ topic }) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "seed_keyword",
              schema: {
                type: "object",
                properties: {
                  seed: { type: "string", pattern: "^[A-Za-z0-9\\s]+$" },
                },
                required: ["seed"],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.2,
        });
        const content = completion.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const s = String(parsed?.seed ?? "").trim();
        if (!s || /[^A-Za-z0-9\s]/.test(s)) {
          this.logger.warn(
            `Invalid seed received for topic "${topic}": "${s}"`
          );
          throw new Error("invalid seed");
        }
        this.logger.debug(`Seed keyword for "${topic}": "${s}"`);
        return s;
      },
      {
        retries: 3,
        onFailedAttempt: (e) =>
          this.logger.warn(
            `Seed generation attempt ${e.attemptNumber} failed: ${e.message}`
          ),
      }
    );

    this.logger.debug(
      `Fetching related keywords from SE Ranking for "${seed}"...`
    );
    const related = await this.metrics.getRelated({
      source: "us",
      keyword: seed,
      limit: 50,
    
      history_trend: false,
      filter: { volume: { from: 50 }, difficulty: { to: 45 } },
    });
    this.logger.debug(
      `Retrieved ${related.items.length} related keywords for "${seed}"`
    );

    const candidates = related.items
      .map((k) => ({
        keyword: k.keyword,
        volume: k.volume ?? 0,
        difficulty: k.difficulty ?? 0,
        intents: k.intents ?? [],
      }))
      .filter((k) => k.keyword);

    if (!candidates.length) {
      this.logger.warn(`No candidate keywords returned for seed "${seed}"`);
      return [];
    }

    const chosen = await pRetry(
      async () => {
        const completion = await this.groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: `
                Select exactly 12 keywords from the provided candidates for the topic.
                Mark exactly one as "recommended".
                Output JSON only. Each item must include:
                { "keyword": string, "recommended": boolean }.

                Selection criteria:
                - Prioritize keywords with a **strong balance of search volume and low-to-moderate difficulty**.
                - Avoid keywords with very low volume, even if the difficulty is low.
                - Prefer keywords with solid volume and manageable difficulty over keywords that are only easy to rank for.
                - Favor keywords that reflect strong searcher intent aligned with the topic.
                - The "recommended" keyword should be the **single best opportunity** overall — ideally good search volume and realistic ranking potential.

                Constraints:
                - Exactly 12 keywords.
                - Exactly one recommended keyword.
                - No duplicates, empty strings, or irrelevant keywords.
              `,
            },
            {
              role: "user",
              content: JSON.stringify({
                topic,
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
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "primary_keywords",
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    minItems: 12,
                    maxItems: 12,
                    items: {
                      type: "object",
                      properties: {
                        keyword: { type: "string" },
                        recommended: { type: "boolean" },
                      },
                      required: ["keyword", "recommended"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.3,
        });
        const content = completion.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        const normalized = items
          .map((x: any) => ({
            keyword: String(x?.keyword ?? "").trim(),
            recommended: Boolean(x?.recommended),
          }))
          .filter((x: any) => x.keyword);
        if (normalized.length !== 12) throw new Error("invalid selection");
        const recommendedCount = normalized.filter(
          (x: any) => x.recommended
        ).length;
        if (recommendedCount !== 1)
          throw new Error("invalid recommended count");
        const rec = normalized.find((x: any) => x.recommended)?.keyword ?? "";
        this.logger.debug(`Recommended keyword selected: "${rec}"`);
        return normalized as { keyword: string; recommended: boolean }[];
      },
      {
        retries: 3,
        onFailedAttempt: (e) =>
          this.logger.warn(
            `Keyword selection attempt ${e.attemptNumber} failed: ${e.message}`
          ),
      }
    );

    const map = new Map<
      string,
      { volume?: number; difficulty?: number; intents?: SerpIntent[] }
    >();
    for (const c of candidates)
      map.set(c.keyword.toLowerCase(), {
        volume: c.volume,
        difficulty: c.difficulty,
        intents: c.intents as SerpIntent[],
      });

    const out: KeywordSuggestion[] = chosen.map((x) => {
      const m = map.get(x.keyword.toLowerCase());
      const intent = (m?.intents && m.intents[0]) || undefined;
      return {
        keyword: x.keyword,
        volume: m?.volume,
        difficulty: m?.difficulty,
        intent,
        recommended: x.recommended,
      };
    });

    this.logger.debug(`Caching ${out.length} suggestions at ${cacheKey}`);
    await this.cache.set(cacheKey, out, 60 * 60 * 24 * 1000 * 2);
    return out;
  }

  async suggestTitle(topic: string, primaryKeyword: string): Promise<string[]> {
    const cacheKey = `suggestions:title:${topic}:${primaryKeyword}`;
    this.logger.debug(`Cache lookup for ${cacheKey}`);
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached?.length) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const titles = await pRetry(
      async () => {
        const system = [
          "You are an SEO copy assistant. Generate compelling, human-friendly blog post TITLES.",
          "Requirements:",
          "- Return exactly 5 unique titles as JSON only.",
          "- Each title should naturally incorporate the provided primary keyword once, preferably near the beginning.",
          "- 55–70 characters when possible; keep under 60–65 characters if a tight title is clearly better.",
          "- No clickbait, no ALL CAPS, minimal punctuation, use sentence case or Title Case.",
          "- Avoid brand names and years unless explicitly present in the topic.",
          "- Titles must be distinct angles, not minor phrasing tweaks.",
        ].join("\n");

        const user = {
          topic,
          primaryKeyword,
        };

        const completion = await this.groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(user) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "blog_titles",
              schema: {
                type: "object",
                properties: {
                  titles: {
                    type: "array",
                    minItems: 5,
                    maxItems: 5,
                    items: { type: "string" },
                  },
                },
                required: ["titles"],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.7,
        });

        const content = completion.choices?.[0]?.message?.content ?? "{}";
        this.logger.debug(`Groq titles response: ${content}`);
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed?.titles)
          ? (parsed.titles as string[])
          : [];
        const normalized = Array.from(
          new Set(list.map((t) => String(t).trim()))
        ).filter(Boolean);
        if (normalized.length !== 5) {
          this.logger.warn(`Invalid titles count: ${normalized.length}`);
          throw new Error("invalid titles");
        }
        return normalized;
      },
      {
        retries: 3,
        onFailedAttempt: (e) =>
          this.logger.warn(
            `Title generation attempt ${e.attemptNumber} failed: ${e.message}`
          ),
      }
    );

    this.logger.debug(`Caching titles at ${cacheKey}`);
    await this.cache.set(cacheKey, titles, 60 * 60 * 24 * 1000 * 2);
    return titles;
  }

  async suggestSecondaryKeywords(
    topic: string,
    primaryKeyword: string,
    title: string
  ): Promise<KeywordSuggestion[]> {
    const cacheKey = `suggestions:secondary:${topic}:${primaryKeyword}:${title}`;
    this.logger.debug(`Cache lookup for ${cacheKey}`);
    const cached = await this.cache.get<KeywordSuggestion[]>(cacheKey);
    if (cached?.length) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.debug(
      `Fetching related keywords from SE Ranking for "${primaryKeyword}"...`
    );
    const related = await this.metrics.getRelated({
      source: "us",
      keyword: primaryKeyword,
      limit: 50,
      history_trend: false,
      filter: { volume: { from: 50 }, difficulty: { to: 45 } },
    });
    this.logger.debug(
      `Retrieved ${related.items.length} related keywords for "${primaryKeyword}"`
    );

    const candidates = related.items
      .map((k) => ({
        keyword: k.keyword,
        volume: k.volume ?? 0,
        difficulty: k.difficulty ?? 0,
        intents: k.intents ?? [],
      }))
      .filter((k) => k.keyword);

    if (!candidates.length) {
      this.logger.warn(
        `No candidate keywords returned for primary "${primaryKeyword}"`
      );
      return [];
    }

    const chosen = await pRetry(
      async () => {
        const completion = await this.groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: `
You are an SEO assistant. From the provided candidate keywords, select exactly 30 secondary keywords for a blog post. Only choose related keywords (semantically connected to the primary keyword) that expand topical coverage with distinct modifiers or subtopics. Do not include question keywords, listicle patterns, how/why/what queries, brand names, locations, "near me", store/shop/buy terms, or duplicates/near-duplicates that add no new meaning.

Constraints:
- Exactly 30 total keywords.
- Exactly 5 must be marked "recommended": true. The remaining 25 must have "recommended": false.
- Output JSON only with shape: { "items": [ { "keyword": string, "recommended": boolean } ] }.

Selection guidance:
- Prioritize semantically related non-question terms that naturally fit as subtopics or H2/H3 sections.
- Prefer higher volume with low-to-moderate difficulty when possible.
- Maximize distinct semantic coverage around the topic and title; include meaningful modifiers (use-cases, attributes, contexts) without drifting into questions or transactional phrasing.
- Exclude the primary keyword itself and trivial rewrites (plural/singular, stopword swaps) unless a specific modifier adds unique intent.
- Avoid misspellings, branded queries, and irrelevant terms.
            `,
            },
            {
              role: "user",
              content: JSON.stringify({
                topic,
                title,
                primaryKeyword,
                candidates: candidates.map((c) => ({
                  keyword: c.keyword,
                  volume: c.volume,
                  difficulty: c.difficulty,
                  intents: c.intents,
                })),
              }),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "secondary_keywords",
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    minItems: 30,
                    maxItems: 30,
                    items: {
                      type: "object",
                      properties: {
                        keyword: { type: "string" },
                        recommended: { type: "boolean" },
                      },
                      required: ["keyword", "recommended"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
          temperature: 0.3,
        });

        const content = completion.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        const normalized = items
          .map((x: any) => ({
            keyword: String(x?.keyword ?? "").trim(),
            recommended: Boolean(x?.recommended),
          }))
          .filter((x: any) => x.keyword);

        if (normalized.length !== 30)
          throw new Error("invalid selection length");
        const recCount = normalized.filter((x: any) => x.recommended).length;
        if (recCount !== 5) throw new Error("invalid recommended count");
        const uniq = new Set(
          normalized.map((x: any) => x.keyword.toLowerCase())
        );
        if (uniq.size !== normalized.length)
          throw new Error("duplicate keywords");
        if (
          normalized.some(
            (x: any) => x.keyword.toLowerCase() === primaryKeyword.toLowerCase()
          )
        )
          throw new Error("primary keyword included");
        return normalized as { keyword: string; recommended: boolean }[];
      },
      {
        retries: 3,
        onFailedAttempt: (e) =>
          this.logger.warn(
            `Secondary keyword selection attempt ${e.attemptNumber} failed: ${e.message}`
          ),
      }
    );

    const map = new Map<
      string,
      { volume?: number; difficulty?: number; intents?: SerpIntent[] }
    >();
    for (const c of candidates)
      map.set(c.keyword.toLowerCase(), {
        volume: c.volume,
        difficulty: c.difficulty,
        intents: c.intents as SerpIntent[],
      });

    const out: KeywordSuggestion[] = chosen.map((x) => {
      const m = map.get(x.keyword.toLowerCase());
      const intent = (m?.intents && m.intents[0]) || undefined;
      return {
        keyword: x.keyword,
        volume: m?.volume,
        difficulty: m?.difficulty,
        intent,
        recommended: x.recommended,
      };
    });

    this.logger.debug(
      `Caching ${out.length} secondary suggestions at ${cacheKey}`
    );
    await this.cache.set(cacheKey, out, 60 * 60 * 24 * 1000 * 2);
    return out;
  }

  async suggestProduct(blogId: string, topic: string, title: string): Promise<Array<{ id: string; title: string; recommended: boolean }>> {
  const cacheKey = `suggestions:product:${blogId}:${topic}:${title}`;
  const cached = await this.cache.get<Array<{ id: string; title: string; recommended: boolean }>>(cacheKey);
  if (cached?.length) {
    this.logger.debug(`Cache hit for ${cacheKey}`);
    return cached;
  }

  this.logger.debug(`Fetching blog and products for blog ${blogId}...`);
  const blog = await this.prisma.blog.findUniqueOrThrow({
    where: { id: blogId },
    select: { storeId: true },
  });

  const products = await this.prisma.product.findMany({
    where: { storeId: blog.storeId, status: "ACTIVE" },
    select: { id: true, title: true, description: true, tags: true, category: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (!products.length) {
    this.logger.warn(`No products found for blog ${blogId}`);
    return [];
  }

  const recommendedId = await pRetry(
    async () => {
      const completion = await this.groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: [
              "You are a product recommendation assistant for an e-commerce blog.",
              "Choose exactly one product ID from the provided list that best fits the given blog topic and title.",
              "Return JSON only with shape: { \"recommendedId\": string }.",
              "The recommendedId must be one of the provided product IDs.",
              "Optimize for topical relevance to the title/topic, usefulness to readers, and broad appeal."
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              topic,
              title,
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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "product_choice",
            schema: {
              type: "object",
              properties: { recommendedId: { type: "string" } },
              required: ["recommendedId"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
      });

      const content = completion.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const id = String(parsed?.recommendedId ?? "").trim();
      if (!id) throw new Error("empty recommendation");
      const exists = products.some((p) => p.id === id);
      if (!exists) throw new Error("recommended id not in candidates");
      return id;
    },
    {
      retries: 3,
      onFailedAttempt: (e) =>
        this.logger.warn(
          `Product recommendation attempt ${e.attemptNumber} failed: ${e.message}`
        ),
    }
  );

  const out = products.map((p) => ({
    id: p.id,
    title: p.title,
    recommended: p.id === recommendedId,
  }));

  await this.cache.set(cacheKey, out, 60 * 60 * 24 * 1000 * 2);
  return out;
}

}
