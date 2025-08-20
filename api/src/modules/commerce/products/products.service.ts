import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { PRODUCT_SUMMARY_SELECT } from "./constants/selects.constants";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(storeId: string) {
    return this.prisma.product.findMany({
      where: {
        storeId,
      },
      select: PRODUCT_SUMMARY_SELECT,
    });
  }
}

