import { PrismaService } from "@/clients/prisma/prisma.service";
import { PaginatedResult, PaginationParams } from "@/modules/catalog/catalog.types";
import { Injectable } from "@nestjs/common";
import { Collection, Product, Prisma } from "@prisma/client";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(
    storeId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<Product>> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: { storeId },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          collections: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where: { storeId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCollections(
    storeId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<Collection>> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.collection.findMany({
        where: { storeId },
        take: limit,
        skip,
        orderBy: { title: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.collection.count({ where: { storeId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}