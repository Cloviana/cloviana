import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { PrismaService } from '@/clients/prisma/prisma.service';

const TitlesSchema = z.object({
  titles: z.array(z.string().max(100)).length(7),
});

@Injectable()
export class TitleSuggestionsService {
  private readonly openai = new OpenAI();
  private readonly logger = new Logger(TitleSuggestionsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async getTitles(storeId: string, blogId: string): Promise<string[]> {
    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      select: {
        topic: true,
        keyword: {
          select: { phrase: true },
        },
      },
    });

    const topic = blog.topic ?? '';
    const keywordPhrase = blog.keyword?.phrase ?? '';
    const cacheKey = `titles:${topic}:${keywordPhrase}:${storeId}`;

    const cached = await this.cache.get<z.infer<typeof TitlesSchema>>(cacheKey);
    if (cached) {
      this.logger.debug('Returning cached title suggestions');
      return cached.titles;
    }

    const { titles } = await this.generateTitles(topic, keywordPhrase);
    await this.cache.set(cacheKey, { titles }, 1000 * 60 * 60 * 24);
    return titles;
  }

  private async generateTitles(topic: string, keyword: string) {
    const response = await this.openai.responses.parse({
      model: 'gpt-4o-mini-2024-07-18',
      input: [
        {
          role: 'system',
          content:
            'You are an e-commerce SEO strategist. ' +
            'Generate 7 blog post titles (≤100 chars) for the given topic, ' +
            'and include the specified keyword phrase in each title where it fits naturally. '
        },
        {
          role: 'user',
          content: JSON.stringify({ topic, keyword }),
        },
      ],
      text: {
        format: zodTextFormat(TitlesSchema, 'titles'),
      },
    });

    this.logger.debug('Generated title suggestions');
    return response.output_parsed!;
  }
}
