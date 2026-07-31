import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { KnowledgeBaseClient } from "../knowledge-base.client";

const DEFAULT_FOLDER_NAME = "Default";
const MAX_FOLDER_DEPTH = 10;

interface UpdateFolderInput {
  name?: string;
  parentId?: string | null;
  position?: number;
}

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeBaseClient: KnowledgeBaseClient,
  ) {}

  async listFolders(businessId: string) {
    await this.getOrCreateDefaultFolder(businessId);
    return this.prisma.folder.findMany({
      where: { businessId },
      select: {
        id: true,
        businessId: true,
        parentId: true,
        name: true,
        position: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true,
            documents: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [{ parentId: "asc" }, { position: "asc" }, { name: "asc" }],
    });
  }

  async createFolder(businessId: string, name: string, parentId?: string) {
    await this.getOrCreateDefaultFolder(businessId);
    const normalizedName = this.normalizeFolderName(name);
    if (parentId) {
      await this.assertValidParentFolder(businessId, parentId);
    }

    const lastSibling = await this.prisma.folder.findFirst({
      where: { businessId, parentId: parentId ?? null },
      select: { position: true },
      orderBy: { position: "desc" },
    });

    try {
      return await this.prisma.folder.create({
        data: {
          businessId,
          parentId: parentId ?? null,
          name: normalizedName,
          position: (lastSibling?.position ?? -1) + 1,
        },
      });
    } catch (error) {
      this.rethrowFolderWriteError(error);
    }
  }

  async updateFolder(
    businessId: string,
    folderId: string,
    update: UpdateFolderInput,
  ) {
    const currentFolder = await this.findFolderOrThrow(businessId, folderId);
    const updatedName =
      update.name === undefined
        ? currentFolder.name
        : this.normalizeFolderName(update.name);
    const updatedParentId =
      update.parentId === undefined ? currentFolder.parentId : update.parentId;

    if (currentFolder.isDefault && updatedParentId !== null) {
      throw new ConflictException("The default folder must remain at the root");
    }
    if (updatedParentId !== currentFolder.parentId) {
      await this.assertValidParentFolder(businessId, updatedParentId, folderId);
    }

    const updatedFolder = await this.prisma.folder
      .update({
        where: { id: folderId },
        data: {
          name: updatedName,
          parentId: updatedParentId,
          ...(update.position === undefined
            ? {}
            : { position: update.position }),
        },
      })
      .catch((error) => this.rethrowFolderWriteError(error));

    if (updatedName !== currentFolder.name) {
      void this.knowledgeBaseClient
        .renameFolder(businessId, folderId, updatedName)
        .catch((error) =>
          this.logger.error(
            `Failed to sync renamed folder businessId=${businessId} folderId=${folderId}`,
            error instanceof Error ? error.stack : undefined,
          ),
        );
    }
    return updatedFolder;
  }

  async deleteFolder(businessId: string, folderId: string): Promise<void> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, businessId },
      select: {
        id: true,
        isDefault: true,
        _count: {
          select: {
            children: true,
            documents: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!folder) {
      throw new NotFoundException("Folder not found");
    }
    if (folder.isDefault) {
      throw new ConflictException("The default folder cannot be deleted");
    }
    if (folder._count.children > 0 || folder._count.documents > 0) {
      throw new ConflictException("Only empty folders can be deleted");
    }
    const pendingDeletionCount = await this.prisma.document.count({
      where: { businessId, folderId, deletedAt: { not: null } },
    });
    if (pendingDeletionCount > 0) {
      throw new ConflictException(
        "Wait for document deletion to finish before deleting this folder",
      );
    }
    await this.prisma.folder.delete({ where: { id: folderId } });
  }

  async getOrCreateDefaultFolder(businessId: string) {
    const existingFolder = await this.prisma.folder.findFirst({
      where: { businessId, isDefault: true },
    });
    if (existingFolder) {
      return existingFolder;
    }

    try {
      return await this.prisma.folder.create({
        data: {
          businessId,
          name: DEFAULT_FOLDER_NAME,
          isDefault: true,
          position: 0,
        },
      });
    } catch (error) {
      if (!this.isUniqueConstraintViolation(error)) {
        throw error;
      }
      const concurrentlyCreatedFolder = await this.prisma.folder.findFirst({
        where: { businessId, isDefault: true },
      });
      if (!concurrentlyCreatedFolder) {
        throw error;
      }
      return concurrentlyCreatedFolder;
    }
  }

  async findFolderOrThrow(businessId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, businessId },
    });
    if (!folder) {
      throw new NotFoundException("Folder not found");
    }
    return folder;
  }

  private normalizeFolderName(name: string): string {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      throw new BadRequestException("Folder name is required");
    }
    if (normalizedName.length > 100) {
      throw new BadRequestException(
        "Folder name cannot be longer than 100 characters",
      );
    }
    return normalizedName;
  }

  private async assertValidParentFolder(
    businessId: string,
    parentId: string | null,
    movingFolderId?: string,
  ): Promise<void> {
    if (!parentId) {
      return;
    }
    if (parentId === movingFolderId) {
      throw new BadRequestException("A folder cannot contain itself");
    }

    let currentId: string | null = parentId;
    for (let depth = 0; depth < MAX_FOLDER_DEPTH; depth += 1) {
      const folder: { id: string; parentId: string | null } | null =
        await this.prisma.folder.findFirst({
          where: { id: currentId, businessId },
          select: { id: true, parentId: true },
        });
      if (!folder) {
        throw new NotFoundException("Parent folder not found");
      }
      if (folder.id === movingFolderId) {
        throw new BadRequestException(
          "A folder cannot be moved into its child",
        );
      }
      if (!folder.parentId) {
        return;
      }
      currentId = folder.parentId;
    }
    throw new BadRequestException(
      `Folders cannot be nested more than ${MAX_FOLDER_DEPTH} levels`,
    );
  }

  private rethrowFolderWriteError(error: unknown): never {
    if (this.isUniqueConstraintViolation(error)) {
      throw new ConflictException(
        "A folder with this name already exists in that location",
      );
    }
    throw error;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
