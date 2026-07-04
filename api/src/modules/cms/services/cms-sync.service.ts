import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/config/app.configuration";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import type { CmsConnection } from "@prisma/client";
import { JobType, Prisma } from "@prisma/client";

type AgentPage = {
  external_id: string;
  title: string;
  slug: string;
  url: string;
  excerpt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  cluster?: string | null;
  published_date?: string | null;
  last_modified?: string | null;
};

type PlatformSummary = { pages: number } | { error: string };

@Injectable()
export class CmsSyncService {
  private readonly logger = new Logger(CmsSyncService.name);
  private readonly agentUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    config: AppConfiguration,
  ) {
    this.agentUrl = config.agentUrl.replace(/\/$/, "");
  }

  runSync(businessId: string, dedupeKey: string) {
    return this.managedJobs.runJobInline({
      type: JobType.CMS_SYNC,
      businessId,
      dedupeKey,
      execute: () => this.syncBusiness(businessId),
      serializeResult: (result) => result as Prisma.InputJsonValue,
    });
  }

  private async syncBusiness(businessId: string) {
    const connections = await this.prisma.cmsConnection.findMany({
      where: { businessId },
    });
    const summary: Record<string, PlatformSummary> = {};
    for (const connection of connections) {
      try {
        summary[connection.platform] = {
          pages: await this.syncConnection(connection),
        };
      } catch (err: any) {
        // Framer stub and transient platform failures land here; a broken
        // connector must never block the others.
        this.logger.warn(
          `CMS sync failed platform=${connection.platform} businessId=${businessId}: ${err.message}`,
        );
        summary[connection.platform] = {
          error: String(err.message).slice(0, 300),
        };
      }
    }
    return summary;
  }

  private async syncConnection(connection: CmsConnection): Promise<number> {
    const response = await fetch(`${this.agentUrl}/agent/cms/pages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platform: connection.platform.toLowerCase(),
        credentials: connection.config,
        modifiedAfter: connection.syncCursor ?? undefined,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      throw new Error(`Agent CMS endpoint returned ${response.status}`);
    }
    const { pages } = (await response.json()) as { pages: AgentPage[] };

    let cursor = connection.syncCursor;
    let count = 0;
    for (const page of pages ?? []) {
      if (!page?.external_id || !page.url) continue;
      const fields = {
        title: page.title || page.slug || page.url,
        slug: page.slug ?? "",
        url: page.url,
        excerpt: page.excerpt ?? null,
        metaTitle: page.meta_title ?? null,
        metaDescription: page.meta_description ?? null,
        cluster: page.cluster ?? null,
        publishedDate: page.published_date ? new Date(page.published_date) : null,
        lastModified: page.last_modified ? new Date(page.last_modified) : null,
        syncedAt: new Date(),
      };
      await this.prisma.cmsPage.upsert({
        where: {
          businessId_platform_externalId: {
            businessId: connection.businessId,
            platform: connection.platform,
            externalId: String(page.external_id),
          },
        },
        create: {
          businessId: connection.businessId,
          platform: connection.platform,
          externalId: String(page.external_id),
          ...fields,
        },
        update: fields,
      });
      count += 1;
      if (page.last_modified && (!cursor || page.last_modified > cursor)) {
        cursor = page.last_modified;
      }
    }

    await this.prisma.cmsConnection.update({
      where: { id: connection.id },
      data: { syncCursor: cursor, lastSyncedAt: new Date() },
    });
    return count;
  }
}
