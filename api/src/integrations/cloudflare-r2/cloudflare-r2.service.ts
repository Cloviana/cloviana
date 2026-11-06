import { Readable } from "node:stream";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";

import { AppConfiguration } from "@/platform/config/app.configuration";

@Injectable()
export class CloudflareR2Service {
  private client?: S3Client;

  constructor(private readonly config: AppConfiguration) {}

  private storage() {
    const {
      r2Endpoint,
      r2AccessKeyId,
      r2SecretAccessKey,
      r2Bucket,
      r2PublicBaseUrl,
    } = this.config;
    if (
      !r2Endpoint ||
      !r2AccessKeyId ||
      !r2SecretAccessKey ||
      !r2Bucket ||
      !r2PublicBaseUrl
    ) {
      throw new ServiceUnavailableException("Image storage is not configured.");
    }
    return {
      client: this.connect(r2Endpoint, r2AccessKeyId, r2SecretAccessKey),
      bucket: r2Bucket,
      publicBaseUrl: r2PublicBaseUrl.replace(/\/$/, ""),
    };
  }

  // The private bucket is never served publicly, so it needs no public base URL.
  private privateStorage() {
    const { r2Endpoint, r2AccessKeyId, r2SecretAccessKey, r2PrivateBucket } =
      this.config;
    if (
      !r2Endpoint ||
      !r2AccessKeyId ||
      !r2SecretAccessKey ||
      !r2PrivateBucket
    ) {
      throw new ServiceUnavailableException(
        "Private storage is not configured.",
      );
    }
    return {
      client: this.connect(r2Endpoint, r2AccessKeyId, r2SecretAccessKey),
      bucket: r2PrivateBucket,
    };
  }

  private connect(
    endpoint: string,
    accessKeyId: string,
    secretAccessKey: string,
  ) {
    this.client ??= new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  async prepareUpload(key: string, contentType: string) {
    const { client, bucket } = this.storage();
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 },
    );
    return { path: key, url, contentType };
  }

  async inspect(key: string) {
    const { client, bucket } = this.storage();
    return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  }

  async readHeader(key: string, etag: string) {
    const { client, bucket } = this.storage();
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: "bytes=0-4100",
        IfMatch: etag,
      }),
    );
    return result.Body?.transformToByteArray();
  }

  async promote(
    source: string,
    destination: string,
    etag: string,
    contentType: string,
  ) {
    const { client, bucket, publicBaseUrl } = this.storage();
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: destination,
        CopySource: `${encodeURIComponent(bucket)}/${source.split("/").map(encodeURIComponent).join("/")}`,
        CopySourceIfMatch: etag,
        MetadataDirective: "REPLACE",
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${publicBaseUrl}/${destination.split("/").map(encodeURIComponent).join("/")}`;
  }

  async remove(key: string) {
    const { client, bucket } = this.storage();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  /** Server-side copy inside the private bucket; nothing is downloaded and no public headers are set. */
  async copyPrivate(source: string, destination: string) {
    const { client, bucket } = this.privateStorage();
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: destination,
        CopySource: `${encodeURIComponent(bucket)}/${source.split("/").map(encodeURIComponent).join("/")}`,
      }),
    );
  }

  async readPrivateText(key: string) {
    const { client, bucket } = this.privateStorage();
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return (await result.Body?.transformToString()) ?? "";
  }

  async readPrivate(key: string, maxBytes = 100 * 1024 * 1024) {
    const { client, bucket } = this.privateStorage();
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = result.Body;
    if (!body || (result.ContentLength ?? 0) > maxBytes) {
      if (body instanceof Readable) {
        body.destroy();
      }
      throw new Error("Private object is missing or too large");
    }
    if (!(body instanceof Readable)) {
      throw new Error("Unexpected private storage response stream");
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of body) {
      if (!(chunk instanceof Uint8Array)) {
        body.destroy();
        throw new Error("Unexpected private storage response data");
      }
      size += chunk.byteLength;
      if (size > maxBytes) {
        body.destroy();
        throw new Error("Private object is too large");
      }
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks, size);
  }

  async writePrivate(
    key: string,
    body: Buffer,
    contentType = "application/gzip",
  ) {
    const { client, bucket } = this.privateStorage();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async privateDownloadUrl(key: string, expiresIn = 300) {
    const { client, bucket } = this.privateStorage();
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  }

  async preparePrivateUpload(
    key: string,
    contentType: string,
    size: number,
    expiresIn = 300,
  ) {
    const { client, bucket } = this.privateStorage();
    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn },
    );
  }

  async removePrivate(key: string) {
    const { client, bucket } = this.privateStorage();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
