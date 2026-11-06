import { Injectable } from "@nestjs/common";

import type { AttributeRepository } from "@/modules/catalog/application/ports/attribute.repository.port";
import type {
  AttributeListInput,
  AttributePage,
} from "@/modules/catalog/domain/attribute";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

@Injectable()
export class PrismaAttributeRepository implements AttributeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    marketplaceId: string,
    input: AttributeListInput,
  ): Promise<AttributePage> {
    const rows = await this.prisma.productAttribute.findMany({
      where: {
        marketplaceId,
        productId: null,
        isActive: true,
        isVariantAxis: true,
        type: "SINGLE_SELECT",
        values: { some: { marketplaceId, isActive: true } },
        ...(input.search
          ? { name: { contains: input.search, mode: "insensitive" as const } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        values: {
          where: { marketplaceId, isActive: true },
          select: { id: true, name: true },
          orderBy: [{ rank: "asc" }, { name: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ rank: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: input.offset,
      take: input.limit + 1,
    });

    return {
      items: rows.slice(0, input.limit),
      nextOffset: rows.length > input.limit ? input.offset + input.limit : null,
    };
  }
}
