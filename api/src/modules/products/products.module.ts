import { Module } from "@nestjs/common";

import { ProductsController } from "./products.controller";
import { ProductsService } from "./services/products.service";
import { ProductsConsumer } from "./services/products.consumer";
import { SyncProductsModule } from "@/workflows";

@Module({
  imports: [SyncProductsModule],
  controllers: [ProductsController, ProductsConsumer],
  providers: [ProductsService],
})
export class ProductsModule {}
