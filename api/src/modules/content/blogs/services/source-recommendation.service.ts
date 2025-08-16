import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { AppConfiguration } from "@/config/app.configuration";
import {
  GoogleSearchItem,
  RankedGoogleSearchItem,
} from "../interfaces/google-custom-search.interfaces";
import { Retryable } from "@/decorators/retryable.decorator";
import { BLACKLISTED_DOMAINS } from "../constants/seo.constants";

@Injectable()
export class SourceRecommendationService {
  private readonly openai = new OpenAI();

  constructor(
    private readonly http: HttpService,
    private readonly config: AppConfiguration,
  ) {}

  async suggestSources(title: string): Promise<RankedGoogleSearchItem[]> {
    const items = await this.fetchGoogleResults(title);
    return this.rankSources(items);
  }

  @Retryable({ retries: 3, minTimeout: 2000, factor: 2 })
  private async fetchGoogleResults(title: string): Promise<GoogleSearchItem[]> {
    const params = {
      key: this.config.googleApiKey,
      cx: this.config.googleCx,
      q: title,
      num: 10,
    };
    const resp = await firstValueFrom(
      this.http.get("https://www.googleapis.com/customsearch/v1", { params }),
    );

    return (resp.data.items ?? []).map((item: any) => {
      let origin: string;
      try {
        origin = new URL(item.link).origin;
      } catch {
        origin = item.link;
      }

      return {
        title: item.title as string,
        link: item.link as string,
        snippet: item.snippet as string,
        logo: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
          origin,
        )}`,
      };
    });
  }

  @Retryable({ retries: 3, minTimeout: 2000, factor: 2 })
  private async rankSources(
    items: GoogleSearchItem[],
  ): Promise<RankedGoogleSearchItem[]> {
    const { filtered, originalIndexes } = this.filterBlacklisted(items);

    const IndexSchema = z
      .number()
      .int()
      .min(0)
      .max(filtered.length - 1);
    const UniqueFive = z
      .array(IndexSchema)
      .length(5)
      .refine((arr) => new Set(arr).size === 5);
    const ResponseSchema = z.object({ recommendedIndexes: UniqueFive });

    const systemPrompt = [
      "You are an SEO specialist.",
      `Pick exactly 5 of these ${filtered.length} sources…`,
      'Return only {"recommendedIndexes":[i1,i2,i3,i4,i5]}.',
    ].join(" ");

    const res = await this.openai.responses.parse({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(filtered) },
      ],
      text: { format: zodTextFormat(ResponseSchema, "recommendedIndexes") },
    });

    const picked = res.output_parsed!.recommendedIndexes as number[];
    const pickedOriginal = picked.map((i) => originalIndexes[i]);
    return items.map((item, idx) => ({
      ...item,
      recommended: pickedOriginal.includes(idx),
    }));
  }

  private filterBlacklisted(items: GoogleSearchItem[]): {
    filtered: GoogleSearchItem[];
    originalIndexes: number[];
  } {
    const filtered: GoogleSearchItem[] = [];
    const originalIndexes: number[] = [];

    items.forEach((item, idx) => {
      try {
        const host = new URL(item.link).host.replace(/^www\./, "");
        if (!BLACKLISTED_DOMAINS.has(host)) {
          filtered.push(item);
          originalIndexes.push(idx);
        }
      } catch {
        filtered.push(item);
        originalIndexes.push(idx);
      }
    });

    return { filtered, originalIndexes };
  }
}
