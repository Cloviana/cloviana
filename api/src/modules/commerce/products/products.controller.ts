import { Controller, Get, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async listProducts(@Query("storeId") storeId: string) {
    return this.products.getProducts(storeId);
  }
}

