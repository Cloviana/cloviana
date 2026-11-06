import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { CollectionRepository } from "@/modules/catalog/application/ports/collection.repository.port";
import type {
  Collection,
  CollectionListInput,
  CollectionPage,
} from "@/modules/catalog/domain/collection";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

const collectionSelect = {
  id: true,
  title: true,
  handle: true,
} satisfies Prisma.ProductCollectionSelect;

@Injectable()
export class PrismaCollectionRepository implements CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    marketplaceId: string,
    input: CollectionListInput,
  ): Promise<CollectionPage> {
    const rows = await this.prisma.productCollection.findMany({
      where: {
        marketplaceId,
        ...(input.search
          ? { title: { contains: input.search, mode: "insensitive" as const } }
          : {}),
      },
      select: collectionSelect,
      orderBy: [{ title: "asc" }, { id: "asc" }],
      skip: input.offset,
      take: input.limit + 1,
    });

    return {
      items: rows.slice(0, input.limit),
      nextOffset: rows.length > input.limit ? input.offset + input.limit : null,
    };
  }

  findById(marketplaceId: string, id: string): Promise<Collection | null> {
    return this.prisma.productCollection.findFirst({
      where: { marketplaceId, id },
      select: collectionSelect,
    });
  }
}
