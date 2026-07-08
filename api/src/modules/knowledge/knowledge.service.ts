import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/common/config/app.configuration";
import { KnowledgeProducer } from "@/infrastructure/messaging/producers/knowledge.producer";
import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DocumentTag } from "@prisma/client";

export type KnowledgeUpload = {
  name: string;
  extension: string;
  filename: string;
  mimetype: string;
  buffer: Buffer;
  tag: DocumentTag;
};

export type KnowledgeSearch = {
  businessId: string;
  query: string;
  tags?: DocumentTag[];
  limit?: number;
};

export type KnowledgeSearchResult = {
  text: string;
  score: number;
  documentId: string;
  businessId: string;
  tag: DocumentTag;
  filename: string;
  chunkIndex: number;
  title: string | null;
  section: string | null;
  okfType: string | null;
  resource: string | null;
};

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly baseUrl: string;
  private readonly uploadsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: AppConfiguration,
    private readonly knowledgeProducer: KnowledgeProducer,
  ) {
    this.baseUrl = `${config.knowledgeBaseUrl.replace(/\/$/, "")}/`;
    this.uploadsDir = config.knowledgeUploadsDir;
  }

  list(businessId: string) {
    return this.prisma.document.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    }).then((documents) =>
      documents.map((document) => this.publicDocument(document)),
    );
  }

  async search({
    businessId,
    query,
    tags,
    limit = 5,
  }: KnowledgeSearch): Promise<KnowledgeSearchResult[]> {
    const response = await this.request("search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessId, query, tags, limit }),
    });
    return response.json() as Promise<KnowledgeSearchResult[]>;
  }

  async upload(businessId: string, files: KnowledgeUpload[]) {
    const createdDocuments = [];
    const storedPaths: string[] = [];

    try {
      for (const file of files) {
        const documentId = randomUUID();
        const filePath = this.localFilePath(
          businessId,
          documentId,
          file.extension,
        );
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, file.buffer);
        storedPaths.push(filePath);

        const document = await this.prisma.document.create({
          data: {
            id: documentId,
            businessId,
            name: file.name,
            extension: file.extension,
            filename: file.filename,
            mimeType: file.mimetype,
            filePath,
            tag: file.tag,
            status: "PROCESSING",
            failureReason: null,
            indexedAt: null,
          } as any,
        });
        createdDocuments.push(this.publicDocument(document));

        await this.knowledgeProducer.runKnowledgeIngestion({
          documentId,
          businessId,
        });
      }
      return createdDocuments;
    } catch (error) {
      await Promise.allSettled(
        storedPaths.map((filePath) => unlink(filePath)),
      );
      try {
        await this.prisma.document.deleteMany({
          where: { id: { in: createdDocuments.map(({ id }) => id) } },
        });
      } catch (cleanupError) {
        this.logger.error("Failed to roll back document records", cleanupError);
      }
      throw error;
    }
  }

  async update(businessId: string, documentId: string, tag: DocumentTag) {
    const document = await this.requireDocument(businessId, documentId);
    if ((document as any).status === "READY") {
      await this.request(`documents/${encodeURIComponent(documentId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, tag }),
      });
    }
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { tag },
    });
    return this.publicDocument(updated);
  }

  async delete(businessId: string, documentId: string) {
    const document = await this.requireDocument(businessId, documentId);
    if ((document as any).status === "READY") {
      await this.removeFromKnowledgeBase(businessId, documentId);
    }
    if ((document as any).filePath) {
      await unlink((document as any).filePath).catch(() => undefined);
    }
    await this.prisma.document.delete({ where: { id: documentId } });
  }

  async ingestQueuedDocument(businessId: string, documentId: string) {
    const document = await this.requireDocument(businessId, documentId);
    if ((document as any).status !== "PROCESSING") return document;
    if (!(document as any).filePath || !(document as any).filename) {
      throw new Error("Document is missing stored file metadata");
    }

    try {
      const buffer = await readFile((document as any).filePath);
      await this.ingest(
        {
          id: document.id,
          businessId: document.businessId,
          tag: document.tag,
        },
        {
          name: document.name,
          extension: document.extension,
          filename: (document as any).filename,
          mimetype: (document as any).mimeType || "application/octet-stream",
          buffer,
          tag: document.tag,
        },
      );
      return this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: "READY",
          failureReason: null,
          indexedAt: new Date(),
        } as any,
      });
    } catch (error: any) {
      await this.removeFromKnowledgeBase(businessId, documentId).catch(
        () => undefined,
      );
      // Keep the row so the failure is visible in the UI and retriable,
      // instead of silently deleting the document.
      await this.prisma.document
        .update({
          where: { id: documentId },
          data: {
            status: "FAILED",
            failureReason: String(error?.message ?? "Ingestion failed").slice(
              0,
              1000,
            ),
          } as any,
        })
        .catch((updateError) => {
          this.logger.error(
            "Failed to mark document as FAILED after ingestion failure",
            updateError,
          );
        });
      throw error;
    }
  }

  private async requireDocument(businessId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, businessId },
    });
    if (!document) throw new NotFoundException("Document not found");
    return document;
  }

  private localFilePath(
    businessId: string,
    documentId: string,
    extension: string,
  ) {
    return join(this.uploadsDir, businessId, `${documentId}.${extension}`);
  }

  private publicDocument<T extends { filePath?: unknown }>(document: T) {
    const { filePath, ...publicDocument } = document;
    return publicDocument;
  }

  private ingest(
    document: {
      id: string;
      businessId: string;
      tag: DocumentTag;
    },
    file: KnowledgeUpload,
  ) {
    const form = new FormData();
    form.append(
      "file",
      new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
      file.filename,
    );
    form.append("documentId", document.id);
    form.append("businessId", document.businessId);
    form.append("tag", document.tag);
    // Ingestion runs one contextualization LLM call per chunk sequentially;
    // large documents (40-50+ chunks) can take several minutes.
    return this.request(
      "documents",
      { method: "POST", body: form },
      false,
      600_000,
    );
  }

  private removeFromKnowledgeBase(businessId: string, documentId: string) {
    const url = new URL(
      `documents/${encodeURIComponent(documentId)}`,
      this.baseUrl,
    );
    url.searchParams.set("businessId", businessId);
    return this.request(url, { method: "DELETE" }, true);
  }

  private async request(
    path: string | URL,
    init: RequestInit,
    allowNotFound = false,
    timeoutMs = 120_000,
  ) {
    const url = path instanceof URL ? path : new URL(path, this.baseUrl);
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      this.logger.error(`Knowledge base request failed: ${url}`, error);
      throw new BadGatewayException("Knowledge base is unavailable");
    }

    if (!response.ok && !(allowNotFound && response.status === 404)) {
      const detail = (await response.text()).slice(0, 500);
      this.logger.error(
        `Knowledge base returned ${response.status}: ${detail}`,
      );
      throw new BadGatewayException("Knowledge base request failed");
    }

    return response;
  }
}
