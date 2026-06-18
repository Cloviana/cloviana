import { Readable } from "node:stream";
import { AppConfiguration } from "@/config/app.configuration";
import { BlobServiceClient } from "@azure/storage-blob";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly containerName = "uploads";
  private readonly containerClient = this.blobServiceClient.getContainerClient(
    this.containerName,
  );

  constructor(
    @Inject(BlobServiceClient)
    private readonly blobServiceClient: BlobServiceClient,
    private readonly config: AppConfiguration,
  ) {}

  async onModuleInit() {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      console.warn(
        "Could not connect to Azure Storage. Uploads will fail if attempted.",
        error.message,
      );
    }
  }

  async upload(
    path: string,
    data: Blob | ArrayBuffer | ArrayBufferView | Readable,
    contentType = "application/octet-stream",
  ): Promise<string> {
    const client = this.containerClient.getBlockBlobClient(path);
    if (this.isReadable(data)) {
      await client.uploadStream(data, undefined, undefined, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
    } else {
      await client.uploadData(data, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
    }
    return client.url;
  }

  getCdnUrl(path: string): string {
    const base = this.config.azureCdnEndpoint.replace(/\/$/, "");
    return `${base}/${this.containerName}/${path}`;
  }

  private isReadable(obj: any): obj is Readable {
    return obj && typeof obj.pipe === "function";
  }
}
