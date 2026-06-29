import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/common/config/app.configuration";
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

  constructor(
    private readonly prisma: PrismaService,
    config: AppConfiguration,
  ) {
    this.baseUrl = `${config.knowledgeBaseUrl.replace(/\/$/, "")}/`;
  }

  list(businessId: string) {
    return this.prisma.document.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
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
    const documents = await this.prisma.$transaction(
      files.map((file) =>
        this.prisma.document.create({
          data: {
            businessId,
            name: file.name,
            extension: file.extension,
            tag: file.tag,
          },
        }),
      ),
    );
    const ingested: typeof documents = [];

    try {
      for (const [index, document] of documents.entries()) {
        await this.ingest(document, files[index]);
        ingested.push(document);
      }
      return documents;
    } catch (error) {
      await Promise.allSettled(
        ingested.map((document) =>
          this.removeFromKnowledgeBase(businessId, document.id),
        ),
      );
      try {
        await this.prisma.document.deleteMany({
          where: { id: { in: documents.map(({ id }) => id) } },
        });
      } catch (cleanupError) {
        this.logger.error("Failed to roll back document records", cleanupError);
      }
      throw error;
    }
  }

  async update(businessId: string, documentId: string, tag: DocumentTag) {
    await this.requireDocument(businessId, documentId);
    await this.request(`documents/${encodeURIComponent(documentId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessId, tag }),
    });
    return this.prisma.document.update({
      where: { id: documentId },
      data: { tag },
    });
  }

  async delete(businessId: string, documentId: string) {
    await this.requireDocument(businessId, documentId);
    await this.removeFromKnowledgeBase(businessId, documentId);
    await this.prisma.document.delete({ where: { id: documentId } });
  }

  private async requireDocument(businessId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, businessId },
    });
    if (!document) throw new NotFoundException("Document not found");
    return document;
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
    return this.request("documents", { method: "POST", body: form });
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
  ) {
    const url = path instanceof URL ? path : new URL(path, this.baseUrl);
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(120_000),
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
