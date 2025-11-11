import { PrismaService } from "@/clients/prisma/prisma.service";
import { ProductsProducer } from "@/modules/messaging/producers/products.producer";
import { Injectable } from "@nestjs/common";
import { PRODUCT_SUMMARY_SELECT } from "../constants/selects.constants";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly producer: ProductsProducer,
  ) {}

  async getProducts(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId },
      select: PRODUCT_SUMMARY_SELECT,
    });
  }

  async syncProducts(storeId: string) {
    await this.producer.sync({ storeId });
    return { accepted: true };
  }
}
