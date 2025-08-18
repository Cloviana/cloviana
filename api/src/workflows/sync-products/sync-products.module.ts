import { Global, Module } from "@nestjs/common";
import { SyncProductsWorkflow } from "./sync-products.workflow";

@Global()
@Module({
  providers: [SyncProductsWorkflow],
  exports: [SyncProductsWorkflow],
})
export class SyncProductsModule {}
