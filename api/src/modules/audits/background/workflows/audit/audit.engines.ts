import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import type { DataForSeoAiEngine } from "@/integrations/dataforseo/dataforseo.types";
import { Injectable } from "@nestjs/common";
import type {
  AuditPrompt,
  EngineName,
  EngineResult,
  SentimentResponse,
} from "./audit.types";

type EngineConfig = {
  engine: EngineName;
  provider: DataForSeoAiEngine;
};

const ENGINES: EngineConfig[] = [
  { engine: "google-aio", provider: "google-ai-overview" },
  { engine: "chatgpt", provider: "chatgpt" },
  { engine: "perplexity", provider: "perplexity" },
];

const LOCATION_CODES: Record<string, number> = {
  US: 2840,
  GB: 2826,
  CA: 2124,
  AU: 2036,
  DE: 2276,
  FR: 2250,
  ES: 2724,
  IT: 2380,
  NL: 2528,
  SE: 2752,
  NO: 2578,
  DK: 2208,
  FI: 2246,
  BE: 2056,
  CH: 2756,
  AT: 2040,
  PT: 2620,
  PL: 2616,
  BR: 2076,
  MX: 2484,
  IN: 2356,
  SG: 2702,
  ZA: 2710,
  AE: 2784,
  IE: 2372,
  NZ: 2554,
};

function locationCode(country: string): number {
  return LOCATION_CODES[country.toUpperCase()] ?? 2840;
}

@Injectable()
export class AuditEngines {
  constructor(private readonly dataForSeo: DataForSeoService) {}

  async execute(
    prompts: AuditPrompt[],
    country: string,
  ): Promise<EngineResult[]> {
    const results = await Promise.all(
      ENGINES.flatMap((engine) =>
        prompts.map((prompt) => this.executePrompt(engine, prompt, country)),
      ),
    );

    return results;
  }

  async executeSentiment(
    prompts: string[],
    country: string,
  ): Promise<SentimentResponse[]> {
    const requests = prompts.flatMap((prompt) => [
      { prompt, platform: "chatgpt" as const, provider: "chatgpt" as const },
      {
        prompt,
        platform: "google_aio" as const,
        provider: "google-ai-overview" as const,
      },
    ]);

    return Promise.all(
      requests.map(async ({ prompt, platform, provider }, index) => {
        try {
          const answer = await this.dataForSeo.getAiAnswer({
            engine: provider,
            prompt,
            locationCode: locationCode(country),
            languageCode: "en",
          });

          return { id: String(index), prompt, text: answer.content, platform };
        } catch {
          return { id: String(index), prompt, text: "", platform };
        }
      }),
    );
  }

  private async executePrompt(
    config: EngineConfig,
    prompt: AuditPrompt,
    country: string,
  ): Promise<EngineResult> {
    try {
      const answer = await this.dataForSeo.getAiAnswer({
        engine: config.provider,
        prompt: prompt.text,
        locationCode: locationCode(country),
        languageCode: "en",
      });

      return {
        promptId: prompt.id,
        prompt: prompt.text,
        engine: config.engine,
        status: "success",
        text: answer.content,
        sources: answer.citations.map((source) => ({
          title: source.title,
          url: source.url,
          description: source.excerpt ?? "",
        })),
        mentions: [],
      };
    } catch {
      return {
        promptId: prompt.id,
        prompt: prompt.text,
        engine: config.engine,
        status: "failed",
        text: "",
        sources: [],
        mentions: [],
      };
    }
  }
}
