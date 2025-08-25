import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  Injectable,
} from "@nestjs/common";
import { Keyword } from "@prisma/client";
import OpenAI from "openai";

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreKeywords(storeId: string): Promise<Keyword[]> {
    return (
      await this.prisma.storeKeyword.findMany({
        where: { storeId },
        select: {
          keyword: true,
        },
        orderBy: { keyword: { phrase: "asc" } },
      })
    ).map(({ keyword }) => keyword);
  }
}
