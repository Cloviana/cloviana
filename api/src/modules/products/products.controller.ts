import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ProductsService } from "./services/products.service";

@Controller("stores/:storeId/products")
@UseGuards(StoreOwnerGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async listProducts(@Param("storeId") storeId: string) {
    return this.products.getProducts(storeId);
  }

  @Post("sync")
  async sync(@Param("storeId") storeId: string) {
    return this.products.syncProducts(storeId);
  }
}
