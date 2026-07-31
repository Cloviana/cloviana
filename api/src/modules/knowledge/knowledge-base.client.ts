import { AppConfiguration } from "@/common/config/app.configuration";
import { Injectable, Logger } from "@nestjs/common";
import type {
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
} from "./knowledge.types";

const DEFAULT_TIMEOUT_MS = 120_000;
const INGESTION_TIMEOUT_MS = 600_000;

export class KnowledgeBaseRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "KnowledgeBaseRequestError";
  }
}

interface KnowledgeBaseRequestOptions {
  allowNotFound?: boolean;
  timeoutMs?: number;
}

@Injectable()
export class KnowledgeBaseClient {
  private readonly logger = new Logger(KnowledgeBaseClient.name);
  private readonly knowledgeBaseUrl: string;

  constructor(config: AppConfiguration) {
    this.knowledgeBaseUrl = `${config.knowledgeBaseUrl.replace(/\/$/, "")}/`;
  }

  ingestDocument(formData: FormData) {
    return this.sendRequest<{ chunksStored: number }>(
      "documents",
      { method: "POST", body: formData },
      { timeoutMs: INGESTION_TIMEOUT_MS },
    );
  }

  deleteDocument(businessId: string, documentId: string) {
    const requestUrl = new URL(
      `documents/${encodeURIComponent(documentId)}`,
      this.knowledgeBaseUrl,
    );
    requestUrl.searchParams.set("businessId", businessId);
    return this.sendRequest<{ pointsDeleted: number }>(
      requestUrl,
      { method: "DELETE" },
      { allowNotFound: true },
    );
  }

  moveDocument(
    businessId: string,
    documentId: string,
    folderId: string,
    folderName: string,
  ) {
    return this.sendRequest<{ pointsUpdated: number }>(
      `documents/${encodeURIComponent(documentId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, folderId, folderName }),
      },
    );
  }

  renameFolder(businessId: string, folderId: string, folderName: string) {
    return this.sendRequest<{ pointsUpdated: number }>(
      `folders/${encodeURIComponent(folderId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, folderName }),
      },
      { allowNotFound: true },
    );
  }

  searchKnowledge(request: KnowledgeSearchRequest) {
    return this.sendRequest<KnowledgeSearchResult[]>("search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
  }

  private async sendRequest<T>(
    endpoint: string | URL,
    requestInit: RequestInit,
    requestOptions: KnowledgeBaseRequestOptions = {},
  ): Promise<T> {
    const requestUrl =
      endpoint instanceof URL
        ? endpoint
        : new URL(endpoint, this.knowledgeBaseUrl);
    let response: Response;

    try {
      response = await fetch(requestUrl, {
        ...requestInit,
        signal: AbortSignal.timeout(
          requestOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        ),
      });
    } catch (error) {
      this.logger.error(
        `Knowledge base request failed: ${requestUrl}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new KnowledgeBaseRequestError(
        "Knowledge base is unavailable",
        true,
      );
    }

    if (requestOptions.allowNotFound && response.status === 404) {
      return {} as T;
    }

    if (!response.ok) {
      const responseBody = (await response.text()).slice(0, 500);
      this.logger.error(
        `Knowledge base returned ${response.status}: ${responseBody}`,
      );
      throw new KnowledgeBaseRequestError(
        responseBody || "Knowledge base request failed",
        response.status === 429 || response.status >= 500,
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }
}
