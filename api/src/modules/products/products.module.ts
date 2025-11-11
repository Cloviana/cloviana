import { Module } from "@nestjs/common";

import { SyncProductsModule } from "@/workflows";
import { ProductsController } from "./products.controller";
import { ProductsConsumer } from "./services/products.consumer";
import { ProductsService } from "./services/products.service";

@Module({
  imports: [SyncProductsModule],
  controllers: [ProductsController, ProductsConsumer],
  providers: [ProductsService],
})
export class ProductsModule {}
