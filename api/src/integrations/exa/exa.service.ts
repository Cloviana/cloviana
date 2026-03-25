import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import Exa from "exa-js";
import pRetry, { AbortError } from "p-retry";

@Injectable()
export class ExaService {
  private readonly exa: Exa;

  constructor(private readonly config: AppConfiguration) {
    this.exa = new Exa(this.config.exaApiKey);
  }

  async search(
    query: string,
    numResults = 5,
  ): Promise<{ url: string; title: string | null }[]> {
    return pRetry(
      async () => {
        try {
          const response = await this.exa.search(query, {
            numResults,
            category: "company",
            type: "neural",
          });
          return response.results.map((r) => ({
            url: r.url,
            title: r.title ?? null,
          }));
        } catch (err: any) {
          const status = err?.status ?? err?.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw new AbortError(err);
          }
          throw err;
        }
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
        randomize: true,
      },
    );
  }

  async findCompetitors(
    domain: string,
    category: string,
    icp: string,
    summary: string,
  ): Promise<{ domain: string; title: string }[]> {
    return pRetry(
      async () => {
        try {
          const response = await this.exa.search(
            `Most well-known products used by ${icp} in the ${category} space. ${summary}. 
             Find established products with strong market presence that 
             this ICP would recognise and evaluate when buying.`,
            {
              numResults: 29,
              type: "deep-reasoning",
              additionalQueries: [
                `most popular ${category} products on G2 and Capterra`,
                `what products do ${icp} use and evaluate`,
                `top ${category} products well known in the market`,
              ],
              systemPrompt: `You are finding the most well-known competitors for ${domain} in the "${category}" category. Return between 5 and 29 results.

PRIORITY ORDER:
1. Find products the ${icp} would immediately recognise by name
2. Products must have meaningful market presence — listed on G2, Capterra, Trustpilot, or frequently discussed on Reddit and in industry blogs
3. If no well-known direct competitors exist in this exact niche, move up one level in category and find the most well-known products this ICP evaluates day-to-day for this job
4. Never return products with no reviews, no press coverage, and no community presence

Exclude ${domain} from all results.
Do not include Salesforce, HubSpot, Microsoft or Google unless they genuinely dominate this exact ICP's buying process for this specific category.`,
              outputSchema: {
                type: "object",
                required: ["competitors"],
                properties: {
                  competitors: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["domain", "title"],
                      properties: {
                        domain: { type: "string" },
                        title: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          );

          const content = response.output?.content as {
            competitors: { domain: string; title: string }[];
          };

          return (content?.competitors ?? [])
            .filter((c) => c.domain.replace(/^www\./, "") !== domain)
            .slice(0, 29);
        } catch (err: any) {
          const status = err?.status ?? err?.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw new AbortError(err);
          }
          throw err;
        }
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 15000,
        factor: 2,
        randomize: true,
      },
    );
  }
}