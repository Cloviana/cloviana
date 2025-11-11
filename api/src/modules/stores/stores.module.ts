import { Module } from "@nestjs/common";

import { StoreMetadataModule, SyncProductsModule } from "@/workflows";
import { StoresConsumer } from "./services/stores.consumer";
import { StoresService } from "./services/stores.service";
import { StoresController } from "./stores.controller";

@Module({
  imports: [SyncProductsModule, StoreMetadataModule],
  controllers: [StoresController, StoresConsumer],
  providers: [StoresService],
})
export class StoresModule {}
