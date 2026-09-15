import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { AppCacheService } from "@/infrastructure/cache/cache.service";
import { ExaService } from "@/integrations/exa/exa.service";
import type { DeepOutputSchema } from "@/integrations/exa/exa.types";
import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import type {
  BusinessResearchCompetitor,
  BusinessResearchProfile,
} from "./business-research.types";
import { scrapeHomepage } from "./scrape-homepage";

const INVALID_TEXT_VALUES = new Set(["null", "undefined"]);

function isMeaningfulText(value: string): boolean {
  return !INVALID_TEXT_VALUES.has(value.toLowerCase());
}

function normalizeResearchDomain(domain: string): string {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    throw new Error(`Could not normalize domain: ${domain}`);
  }
  return normalizedDomain;
}

const businessProfileSchema = z.object({
  name: z.string().trim().min(1).refine(isMeaningfulText),
  aliases: z.array(z.string().trim().min(1)).min(1),
  description: z.string().trim().min(1).refine(isMeaningfulText),
  icp: z.string().trim().min(1).refine(isMeaningfulText),
  category: z.string().trim().min(1).refine(isMeaningfulText),
});

const businessBrandNameSchema = z.object({
  name: z.string().trim().min(1).refine(isMeaningfulText),
});

function createCompetitorsSchema(count: number) {
  return z.object({
    competitors: z
      .array(
        z.object({
          domain: z.string().trim().min(1),
          name: z.string().trim().min(1),
          aliases: z.array(z.string().trim().min(1)).min(1),
        }),
      )
      .length(count),
  });
}

const businessProfileOutputSchema: DeepOutputSchema = {
  type: "object",
  required: ["name", "aliases", "description", "icp", "category"],
  properties: {
    name: { type: "string" },
    aliases: { type: "array", items: { type: "string" } },
    description: { type: "string" },
    icp: { type: "string" },
    category: { type: "string" },
  },
};

const PROFILE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const COMPETITOR_TTL_MS = 1000 * 60 * 60 * 24 * 3;
const PROFILE_CACHE_VERSION = "v6";
const BRAND_NAME_CACHE_VERSION = "v1";
const COMPETITORS_CACHE_VERSION = "v6";

@Injectable()
export class BusinessResearchService {
  private readonly logger = new Logger(BusinessResearchService.name);
  private readonly promptDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  constructor(
    private readonly cacheService: AppCacheService,
    private readonly exaService: ExaService,
    private readonly groqService: GroqService,
    private readonly openAiService: OpenAIService,
  ) {}

  async extractBrandName(domain: string): Promise<string> {
    const normalizedDomain = normalizeResearchDomain(domain);
    const cacheKey = this.cacheService.buildKey(
      "business-research:brand-name",
      normalizedDomain,
      BRAND_NAME_CACHE_VERSION,
    );

    return this.cacheService.remember({
      key: cacheKey,
      ttl: PROFILE_TTL_MS,
      loader: async () => {
        const exaResponse = await this.exaService.search<
          never,
          { name: string }
        >(normalizedDomain, {
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
        });

        return businessBrandNameSchema.parse(exaResponse.output?.content).name;
      },
    });
  }

  async enrichProfile(domain: string): Promise<BusinessResearchProfile> {
    const normalizedDomain = normalizeResearchDomain(domain);
    const cacheKey = this.cacheService.buildKey(
      "business-research:profile",
      normalizedDomain,
      PROFILE_CACHE_VERSION,
    );

    return this.cacheService.remember({
      key: cacheKey,
      ttl: PROFILE_TTL_MS,
      loader: async () => {
        const researchedProfile =
          await this.researchProfileWithExa(normalizedDomain);
        if (researchedProfile) {
          return researchedProfile;
        }
        return this.researchProfileFromHomepage(normalizedDomain);
      },
    });
  }

  async findCompetitors(
    domain: string,
    count = 8,
  ): Promise<BusinessResearchCompetitor[]> {
    const normalizedDomain = normalizeResearchDomain(domain);
    const profile = await this.enrichProfile(normalizedDomain);

    const cacheKey = this.cacheService.buildKey(
      "business-research:competitors",
      { domain: normalizedDomain, profile, count },
      COMPETITORS_CACHE_VERSION,
    );

    return this.cacheService.remember({
      key: cacheKey,
      ttl: COMPETITOR_TTL_MS,
      loader: () => this.researchCompetitors(normalizedDomain, profile, count),
    });
  }

  private async researchProfileWithExa(
    domain: string,
  ): Promise<BusinessResearchProfile | null> {
    try {
      const exaResponse = await this.exaService.search<
        never,
        BusinessResearchProfile
      >(
        `Research the company, product, ideal customer profile, and buyer-facing category for ${domain}.`,
        {
          type: "auto",
          numResults: 5,
          systemPrompt:
            "Create a concise business profile from public web sources. Prefer the official company website and official product pages when available. Return strict JSON with only name, aliases, description, icp, and category. Aliases must contain the official name plus only distinct public names or abbreviations that unambiguously identify the same brand. The category must be buyer-facing market language useful for finding competitors.",
          outputSchema: businessProfileOutputSchema,
        },
      );

      return businessProfileSchema.parse(exaResponse.output?.content);
    } catch (error) {
      this.logger.warn(
        `Exa profile research failed domain=${domain}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private async researchProfileFromHomepage(
    domain: string,
  ): Promise<BusinessResearchProfile> {
    const systemPrompt = await loadPromptHbs("business-profile", undefined, {
      baseDir: this.promptDirectory,
    });
    const homepageText = await scrapeHomepage(domain).catch((error) => {
      this.logger.warn(
        `Homepage scrape failed domain=${domain}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return "";
    });

    return this.groqService.parse({
      name: "business-profile",
      schema: businessProfileSchema,
      model: "openai/gpt-oss-20b",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({ domain, homepageText }),
        },
      ],
    });
  }

  private async researchCompetitors(
    domain: string,
    profile: BusinessResearchProfile,
    count: number,
  ): Promise<BusinessResearchCompetitor[]> {
    const systemPrompt = await loadPromptHbs(
      "find-competitors",
      { count },
      { baseDir: this.promptDirectory },
    );
    const competitorResult = await this.openAiService.parse({
      name: "find-business-competitors",
      schema: createCompetitorsSchema(count),
      model: "gpt-5.4-mini-2026-03-17",
      reasoning: { effort: "none" },
      temperature: 0.2,
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `<domain>${domain}</domain>\n<profile>\n  <category>${profile.category}</category>\n  <icp>${profile.icp}</icp>\n  <description>${profile.description}</description>\n  <name>${profile.name}</name>\n</profile>`,
        },
      ],
    });

    const seenDomains = new Set<string>();
    const competitors: BusinessResearchCompetitor[] = [];

    for (const competitor of competitorResult.parsed.competitors) {
      const competitorDomain = normalizeDomain(competitor.domain);
      if (
        !competitorDomain ||
        competitorDomain === domain ||
        seenDomains.has(competitorDomain)
      ) {
        continue;
      }

      seenDomains.add(competitorDomain);
      competitors.push({
        domain: competitorDomain,
        name: competitor.name,
        aliases: Array.from(
          new Map(
            [competitor.name, ...competitor.aliases]
              .map((alias) => alias.trim().replace(/\s+/g, " "))
              .filter(Boolean)
              .map((alias) => [alias.toLocaleLowerCase(), alias]),
          ).values(),
        ),
      });
    }

    return competitors.slice(0, count);
  }
}
