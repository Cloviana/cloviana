import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { PrismaService } from "@/clients/prisma/prisma.service";

const KeywordsSchema = z.object({
  keywords: z
    .array(
      z.object({
        id: z.string().uuid(),
        phrase: z.string().max(60),
      }),
    )
    .length(7),
});

@Injectable()
export class KeywordSuggestionsService {
  private readonly openai = new OpenAI();
  private readonly logger = new Logger(KeywordSuggestionsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async getKeywords(storeId: string, blogId: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { topic: true },
    });
    const topic = blog?.topic ?? "";

    const cacheKey = `keywords:${topic}:${storeId}`;
    const cached =
      await this.cache.get<(typeof KeywordsSchema)["_output"]>(cacheKey);
    if (cached) return cached;

    const suggestions = await this.generateKeywords(storeId, topic);
    await this.cache.set(cacheKey, suggestions, 60 * 60 * 24 * 1000);
    return suggestions;
  }

  private async generateKeywords(storeId: string, topic: string) {
    const blogKeywords = await this.prisma.keyword.findMany({
      where: {
        storeKeywords: { some: { storeId, type: "BLOG" } },
      },
      select: { id: true, phrase: true },
      orderBy: { volume: "desc" },
      take: 50,
    });

    const response = await this.openai.responses.parse({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        {
          role: "system",
          content:
            "You are an e-commerce SEO strategist. " +
            "Choose 7 keywords from the provided list that best match the given blog topic. ",
        },
        {
          role: "user",
          content: JSON.stringify({ topic, blogKeywords }),
        },
      ],
      text: {
        format: zodTextFormat(KeywordsSchema, "keywords"),
      },
    });

    const { keywords } = response.output_parsed!;
    this.logger.debug("Generated keyword suggestions");
    return keywords;
  }
}
