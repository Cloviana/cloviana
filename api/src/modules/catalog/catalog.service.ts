import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  PaginatedResult,
  PaginationParams,
} from "@/modules/catalog/catalog.types";
import { Injectable } from "@nestjs/common";
import { Collection, Prisma, Product } from "@prisma/client";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(
    storeId: string,
    { cursor, limit = 20, q }: PaginationParams,
  ): Promise<PaginatedResult<Product>> {
    const where: Prisma.ProductWhereInput = {
      storeId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const items = await this.prisma.product.findMany({
      where,
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: "desc" }],
      include: {
        collections: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      meta: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }

  async getCollections(
    storeId: string,
    { cursor, limit = 20, q }: PaginationParams,
  ): Promise<PaginatedResult<Collection & { productsCount: number }>> {
    const where: Prisma.CollectionWhereInput = {
      storeId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const items = await this.prisma.collection.findMany({
      where,
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const hasMore = items.length > limit;
    const data = (hasMore ? items.slice(0, limit) : items).map(
      ({ _count, ...item }) => ({
        ...item,
        productsCount: _count.products,
      }),
    );
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      meta: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }
}
