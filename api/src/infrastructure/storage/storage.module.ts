import { AppConfiguration } from "@/config/app.configuration";
import { BlobServiceClient } from "@azure/storage-blob";
import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";

@Global()
@Module({
  providers: [
    {
      provide: BlobServiceClient,
      useFactory: (config: AppConfiguration) =>
        BlobServiceClient.fromConnectionString(
          config.azureStorageConnectionString,
        ),
      inject: [AppConfiguration],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
