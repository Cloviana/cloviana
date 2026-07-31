import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import {
  KnowledgeBaseClient,
  KnowledgeBaseRequestError,
} from "../knowledge-base.client";
import type { KnowledgeSearchResult } from "../knowledge.types";

interface KnowledgeSearchInput {
  query: string;
  folderIds?: string[];
  limit?: number;
}

@Injectable()
export class KnowledgeSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeBaseClient: KnowledgeBaseClient,
  ) {}

  async searchKnowledge(
    businessId: string,
    input: KnowledgeSearchInput,
  ): Promise<KnowledgeSearchResult[]> {
    const query = input.query.trim();
    if (!query) {
      throw new BadRequestException("Query cannot be empty");
    }

    const folderIds = input.folderIds
      ? [...new Set(input.folderIds)]
      : undefined;
    await this.validateFolders(businessId, folderIds);

    let searchResults: KnowledgeSearchResult[];
    try {
      searchResults = await this.knowledgeBaseClient.searchKnowledge({
        businessId,
        query,
        folderIds,
        limit: input.limit,
      });
    } catch (error) {
      if (error instanceof KnowledgeBaseRequestError) {
        throw new BadGatewayException("Knowledge search is unavailable");
      }
      throw error;
    }

    const activeResults = await this.removeDeletedDocuments(
      businessId,
      searchResults,
    );
    return this.refreshFolderNames(businessId, activeResults);
  }

  private async validateFolders(
    businessId: string,
    folderIds?: string[],
  ): Promise<void> {
    if (!folderIds?.length) {
      return;
    }

    const existingFolderCount = await this.prisma.folder.count({
      where: { businessId, id: { in: folderIds } },
    });
    if (existingFolderCount !== folderIds.length) {
      throw new BadRequestException("One or more folders do not exist");
    }
  }

  private async removeDeletedDocuments(
    businessId: string,
    results: KnowledgeSearchResult[],
  ): Promise<KnowledgeSearchResult[]> {
    if (results.length === 0) {
      return [];
    }

    const documentIds = [
      ...new Set(results.map((searchResult) => searchResult.documentId)),
    ];
    const activeDocuments = await this.prisma.document.findMany({
      where: {
        businessId,
        id: { in: documentIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    const activeDocumentIds = new Set(
      activeDocuments.map((document) => document.id),
    );

    return results.filter((searchResult) =>
      activeDocumentIds.has(searchResult.documentId),
    );
  }

  private async refreshFolderNames(
    businessId: string,
    results: KnowledgeSearchResult[],
  ): Promise<KnowledgeSearchResult[]> {
    const folderIds = [
      ...new Set(results.map((searchResult) => searchResult.folderId)),
    ];
    if (folderIds.length === 0) {
      return results;
    }

    const folders = await this.prisma.folder.findMany({
      where: { businessId, id: { in: folderIds } },
      select: { id: true, name: true },
    });
    const folderNameById = new Map(
      folders.map((folder) => [folder.id, folder.name]),
    );

    return results.map((searchResult) => ({
      ...searchResult,
      folderName:
        folderNameById.get(searchResult.folderId) ?? searchResult.folderName,
    }));
  }
}
