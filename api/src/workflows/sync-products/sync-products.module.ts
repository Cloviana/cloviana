import { Module } from "@nestjs/common";
import { SyncProductsWorkflow } from "./sync-products.workflow";

@Module({
  providers: [SyncProductsWorkflow],
  exports: [SyncProductsWorkflow],
})
export class SyncProductsModule {}
