import { Module } from "@nestjs/common";

import { StoresController } from "./stores.controller";
import { StoresService } from "./services/stores.service";
import { StoresConsumer } from "./services/stores.consumer";
import { StoreMetadataModule, SyncProductsModule } from "@/workflows";

@Module({
  imports: [SyncProductsModule, StoreMetadataModule],
  controllers: [StoresController, StoresConsumer],
  providers: [StoresService],
})
export class StoresModule {}
