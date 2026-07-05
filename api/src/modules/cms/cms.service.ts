import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";
import { CmsPlatform, Prisma } from "@prisma/client";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  listConnections(businessId: string) {
    return this.prisma.cmsConnection.findMany({
      where: { businessId },
      // ponytail: config (creds) intentionally excluded from reads
      select: {
        id: true,
        platform: true,
        syncCursor: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  upsertConnection(
    businessId: string,
    platform: CmsPlatform,
    config: Prisma.InputJsonValue,
  ) {
    return this.prisma.cmsConnection.upsert({
      where: { businessId_platform: { businessId, platform } },
      create: { businessId, platform, config },
      update: { config, syncCursor: null },
      select: { id: true, platform: true, createdAt: true },
    });
  }

  async deleteConnection(businessId: string, connectionId: string) {
    const { count } = await this.prisma.cmsConnection.deleteMany({
      where: { id: connectionId, businessId },
    });
    if (count === 0) throw new NotFoundException("Connection not found");
    return { deleted: true };
  }

  searchPages(businessId: string, q?: string, limit = 50) {
    return this.prisma.cmsPage.findMany({
      where: {
        businessId,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { excerpt: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: {
        title: true,
        slug: true,
        url: true,
        excerpt: true,
        metaTitle: true,
        metaDescription: true,
        cluster: true,
        publishedDate: true,
      },
      take: Math.min(limit, 200),
      orderBy: { lastModified: "desc" },
    });
  }
}
