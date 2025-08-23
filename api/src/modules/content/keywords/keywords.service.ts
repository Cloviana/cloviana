import { PrismaService } from "@/clients/prisma/prisma.service";
import { Retryable } from "@/decorators/retryable.decorator";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Keyword, KeywordType, Store } from "@prisma/client";
import axios from "axios";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { KeywordSummary } from "./keywords.interfaces";
import {
  extractTextFromHtml,
  normalizeDomainToUrl,
} from "./utils/scraper.utils";
import { mapIntentCode } from "./utils/intent.utils";

@Injectable()
export class KeywordsService {
  private readonly openai = new OpenAI();
  private readonly logger = new Logger(KeywordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getKeywordDetail(storeId: string, phrase: string) {
    const p = phrase.trim();
    if (!p) throw new BadRequestException("Phrase cannot be empty");

    const existing = await this.prisma.keyword.findUnique({
      where: { phrase: p },
      include: {
        storeKeywords: {
          where: { storeId },
        },
      },
    });

    if (existing) return existing;
    /*
    const [summary] = await this.semrush.summary([p]);
    const {
      searchVolume: volume,
      cpc,
      competition,
      intent: rawIntent,
      difficulty,
    } = summary ?? {};
    const intent = mapIntentCode(rawIntent);

    return this.prisma.keyword.upsert({
      where: { phrase: p },
      update: { volume, cpc, competition, intent, difficulty },
      create: { phrase: p, volume, cpc, competition, intent, difficulty },
    });
  }

  async attachKeyword(storeId: string, keywordId: string, type: KeywordType) {
    const storeKeyword = await this.prisma.storeKeyword.upsert({
      where: { storeId_keywordId_type: { keywordId, storeId, type } },
      create: { keywordId, storeId, type },
      update: {},
      include: { keyword: true },
    });

    return storeKeyword.keyword;
    */
  }

  async getStoreKeywords(store: Store, type: KeywordType): Promise<Keyword[]> {
    const filter = { storeId: store.id, type };

    return (
      await this.prisma.storeKeyword.findMany({
        where: filter,
        select: {
          keyword: true,
        },
        orderBy: { keyword: { phrase: "asc" } },
      })
    ).map(({ keyword }) => keyword);
  }

  async seedKeywords(storeId: string): Promise<void> {
    const store = await this.getStore(storeId);
    const text = await this.extractPageTextFromUrl(store.domainUrl);
    const term = await this.suggestBusinessKeyword(text);

    const [businessKeywords, bloggingKeywords] = await Promise.all([
      this.getKeywordSummaries([term], KeywordType.BUSINESS),
      this.getKeywordSummaries([term], KeywordType.BLOG),
    ]);

    /*
    await Promise.all([
      this.saveKeywords(storeId, businessKeywords, KeywordType.BUSINESS),
      this.saveKeywords(storeId, bloggingKeywords, KeywordType.BLOG),
    ]);*/
  }

  private async getStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException("Store not found");
    return store;
  }

  private async getKeywordSummaries(terms: string[], type: KeywordType) {
    /*
    if (this.config.environment === "development") {
      return mockKeywordsSummary(terms);
    }
      */
    /*return type === KeywordType.BUSINESS
      ? this.semrush.summary(terms)
      : this.semrush.related(terms);*/
    return;
  }

  private async saveKeywords(
    storeId: string,
    summaries: KeywordSummary[],
    type: KeywordType,
  ): Promise<void> {
    for (const {
      phrase,
      searchVolume: volume,
      cpc,
      competition,
      intent: rawIntent,
      difficulty,
    } of summaries) {
      await this.prisma.$transaction(async (tx) => {
        try {
          const intent = mapIntentCode(rawIntent);
          const { id: keywordId } = await tx.keyword.upsert({
            where: { phrase },
            update: { volume, cpc, competition, intents: [intent], difficulty },
            create: {
              phrase,
              volume,
              cpc,
              competition,
              intents: [intent],
              difficulty,
            },
          });
          await tx.storeKeyword.upsert({
            where: {
              storeId_keywordId: { storeId, keywordId },
            },
            update: {},
            create: { storeId, keywordId },
          });
        } catch (err) {
          this.logger.warn(`Failed to save ${type} keyword “${phrase}”:`, err);
        }
      });
    }
  }

  @Retryable({ retries: 3, minTimeout: 500, factor: 2 })
  private async extractPageTextFromUrl(domain: string): Promise<string> {
    const url = normalizeDomainToUrl(domain);
    const response = await axios.get(url);
    return extractTextFromHtml(response.data);
  }

  @Retryable({ retries: 3, minTimeout: 2000, factor: 2 })
  private async suggestBusinessKeyword(text: string): Promise<string> {
    const KeywordSchema = z.object({
      businessKeyword: z.string(),
    });

    const response = await this.openai.responses.parse({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        {
          role: "system",
          content: [
            "You are an SEO expert.",
            "Read the website text and output EXACTLY ONE business keyword.",
            "A business keyword is a 1-3-word noun phrase that sums up a main product, service, or unique selling point—for example: “dog treats”, “toothbrushes”, “Wisconsin cheese”.",
            "Keep the keyword broad enough to cover a whole category, but specific enough to show what the brand actually sells.",
            "Do NOT include the company name, URLs, numbers, or generic fillers like “products” or “solutions”.",
            'Return your answer as: { "businessKeyword": "keyword" }',
          ].join(" "),
        },
        { role: "user", content: text },
      ],
      text: {
        format: zodTextFormat(KeywordSchema, "businessKeyword"),
      },
    });

    if (!response.output_parsed?.businessKeyword) {
      throw new Error("Failed to parse business keyword from OpenAI response");
    }

    return response.output_parsed.businessKeyword;
  }
}
