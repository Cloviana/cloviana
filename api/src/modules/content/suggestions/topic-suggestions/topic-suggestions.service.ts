import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { getSeason } from "./utils/date";

const TopicsSchema = z.object({
  topics: z.array(z.string().max(60)).length(7),
});

@Injectable()
export class TopicSuggestionsService {
  private readonly openai = new OpenAI();
  private readonly logger = new Logger(TopicSuggestionsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async getTopics(storeId: string) {
    const key = `topics:${storeId}`;
    const cached = await this.cache.get<string[]>(key);
    if (cached) return cached as string[];

    const topics = await this.generateTopics(storeId);

    await this.cache.set(key, topics, 60 * 60 * 24 * 1000);

    return topics;
  }

  private async generateTopics(storeId: string): Promise<string[]> {
    const businessKeyword = await this.prisma.keyword.findFirst({
      where: {
        storeKeywords: {
          some: { storeId },
        },
      },
      select: { phrase: true },
      orderBy: { volume: "desc" },
    });

    const blogKeywords = await this.prisma.keyword.findMany({
      where: {
        storeKeywords: {
          some: { storeId },
        },
      },
      select: { phrase: true },
      orderBy: { volume: "desc" },
      take: 5,
    });

    const response = await this.openai.responses.parse({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        {
          role: "system",
          content:
            'You are an e-commerce SEO strategist. Return JSON { "topics": [7 strings] }. ' +
            "Each string is a blog **topic** (not a title), ≤60 chars, relevant to the given keywords, " +
            "and broad enough for later AI titling.",
        },
        {
          role: "user",
          content: JSON.stringify({
            businessKeyword: businessKeyword?.phrase ?? "",
            blogKeywords: blogKeywords.map((k) => k.phrase),
            brandVoice: "",
            productCategories: [],
            season: getSeason(),
            pastPosts: [],
            prompt: "",
          }),
        },
      ],
      text: {
        format: zodTextFormat(TopicsSchema, "topics"),
      },
    });

    const { topics } = response.output_parsed!;

    this.logger.debug("Generated topic suggestions");
    return topics;
  }
}
