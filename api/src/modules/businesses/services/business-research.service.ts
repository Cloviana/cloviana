import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { AppCacheService } from "@/infrastructure/cache/cache.service";
import { ExaService } from "@/integrations/exa/exa.service";
import type { DeepOutputSchema } from "@/integrations/exa/exa.types";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { BusinessProfileEnrichment } from "../business-research.types";
import { scrapeHomepage } from "../utils/scrape-homepage";

const MIN_HOMEPAGE_TEXT_LENGTH = 300;

const notNull = (v: string) => v !== "null" && v !== "undefined";

const BusinessProfileSchema = z.object({
  name: z.string().trim().min(1).refine(notNull),
  description: z.string().trim().min(1).refine(notNull),
  icp: z.string().trim().min(1).refine(notNull),
  category: z.string().trim().min(1).refine(notNull),
});

const BusinessBrandNameSchema = z.object({
  name: z.string().trim().min(1).refine(notNull),
});

const BusinessProfileOutputSchema: DeepOutputSchema = {
  type: "object",
  required: ["name", "description", "icp", "category"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    icp: { type: "string" },
    category: { type: "string" },
  },
};

const PROFILE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const COMPETITOR_TTL_MS = 1000 * 60 * 60 * 24 * 3;
const PROFILE_CACHE_VERSION = "v4";
const BRAND_NAME_CACHE_VERSION = "v1";
const COMPETITORS_CACHE_VERSION = "v5";

@Injectable()
export class BusinessResearchService {
  private readonly promptsBaseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  constructor(
    private readonly appCache: AppCacheService,
    private readonly exa: ExaService,
    private readonly groq: GroqService,
    private readonly openai: OpenAIService,
  ) {}

  async extractBrandName(domain: string): Promise<string> {
    const normalizedDomain = domain.trim().toLowerCase();
    const cacheKey = this.appCache.buildKey(
      "business-research:brand-name",
      normalizedDomain,
      BRAND_NAME_CACHE_VERSION,
    );

    return this.appCache.remember({
      key: cacheKey,
      ttl: PROFILE_TTL_MS,
      loader: async () => {
        const response = await this.exa.search<never, { name: string }>(
          normalizedDomain,
          {
            numResults: 1,
            type: "instant",
            includeDomains: [normalizedDomain],
            systemPrompt:
              'Extract the displayed brand or product name from the website. Return strict JSON with only {"name": string}. Use the official on-site brand name, not the raw domain unless that is clearly the brand.',
            outputSchema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
              },
            },
          },
        );

        return BusinessBrandNameSchema.parse(response.output?.content).name;
      },
    });
  }

  async enrichProfile(domain: string): Promise<BusinessProfileEnrichment> {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) {
      throw new Error(`Could not normalize domain: ${domain}`);
    }
    const cacheKey = this.appCache.buildKey(
      "business-research:profile",
      normalizedDomain,
      PROFILE_CACHE_VERSION,
    );

    return this.appCache.remember({
      key: cacheKey,
      ttl: PROFILE_TTL_MS,
      loader: async () => {
        const systemPrompt = await loadPromptHbs(
          "business-profile",
          undefined,
          {
            baseDir: this.promptsBaseDir,
          },
        );
        const homepageText = await scrapeHomepage(normalizedDomain).catch(
          (error) => {
            console.warn(
              `[business-research] Homepage scrape failed for ${normalizedDomain}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );

            return "";
          },
        );

        if (homepageText.length < MIN_HOMEPAGE_TEXT_LENGTH) {
          const exaProfile = await this.exa
            .search<never, BusinessProfileEnrichment>(
              `Research the company, product, ideal customer profile, and buyer-facing category for ${normalizedDomain}.`,
              {
                type: "auto",
                numResults: 5,
                systemPrompt:
                  "Create a concise business profile from public web sources. Prefer the official company website and official product pages when available. Return strict JSON with only name, description, icp, and category. The category must be buyer-facing market language useful for finding competitors.",
                outputSchema: BusinessProfileOutputSchema,
              },
            )
            .then((response) =>
              BusinessProfileSchema.parse(response.output?.content),
            )
            .catch((error) => {
              console.warn(
                `[business-research] Exa profile fallback failed for ${normalizedDomain}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );

              return null;
            });

          if (exaProfile) {
            return exaProfile;
          }
        }

        return this.groq.parse({
          name: "business-profile",
          schema: BusinessProfileSchema,
          model: "openai/gpt-oss-20b",
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: JSON.stringify({
                domain: normalizedDomain,
                homepageText,
              }),
            },
          ],
        });
      },
    });
  }

  async findCompetitors(domain: string, count = 8): Promise<string[]> {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) {
      throw new Error(`Could not normalize domain: ${domain}`);
    }
    const profile = await this.enrichProfile(normalizedDomain);

    const cacheKey = this.appCache.buildKey(
      "business-research:competitors",
      { domain: normalizedDomain, profile, count },
      COMPETITORS_CACHE_VERSION,
    );

    return this.appCache.remember({
      key: cacheKey,
      ttl: COMPETITOR_TTL_MS,
      loader: async () => {
        const systemPrompt = await loadPromptHbs(
          "find-competitors",
          { count },
          {
            baseDir: this.promptsBaseDir,
          },
        );

        const result = await this.openai.parse({
          name: "find-business-competitors",
          schema: z.object({
            competitors: z
              .array(
                z.object({
                  domain: z.string().trim().min(1),
                }),
              )
              .length(count),
          }),
          model: "gpt-5.4-mini-2026-03-17",
          reasoning: { effort: "none" },
          temperature: 0.2,
          input: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: JSON.stringify({ domain: normalizedDomain, profile }),
            },
          ],
        });

        const seen = new Set<string>();
        const domains: string[] = [];

        for (const competitor of result.parsed.competitors) {
          const competitorDomain = normalizeDomain(competitor.domain);

          if (
            !competitorDomain ||
            competitorDomain === normalizedDomain ||
            seen.has(competitorDomain)
          ) {
            continue;
          }

          seen.add(competitorDomain);
          domains.push(competitorDomain);
        }

        return domains.slice(0, count);
      },
    });
  }
}
