import { PrismaService } from "@/clients/prisma/prisma.service";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import { CatalogService } from "@/modules/catalog/catalog.service";
import { Injectable } from "@nestjs/common";
import { JobStatus, JobType } from "@prisma/client";
import { graph } from "./sync-products.graph";

const STALE_MS = 10 * 60 * 1000;

@Injectable()
export class SyncProductsWorkflow {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopify: ShopifyService,
    private readonly catalog: CatalogService,
  ) {}

  async run(storeId: string) {
    const key = `${JobType.PRODUCT_SYNC}:${storeId}:${new Date().toISOString().slice(0, 10)}`;

    let job = await this.prisma.job.upsert({
      where: {
        type_storeId_dedupeKey: {
          type: JobType.PRODUCT_SYNC,
          storeId,
          dedupeKey: key,
        },
      },
      update: {},
      create: {
        type: JobType.PRODUCT_SYNC,
        storeId,
        status: JobStatus.PENDING,
        dedupeKey: key,
      },
    });

    if (job.status === JobStatus.RUNNING) {
      const last = job.lastHeartbeatAt?.getTime() ?? 0;
      const age = Date.now() - last;
      if (age > STALE_MS) {
        job = await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            finishedAt: new Date(),
            error: "Stale running job (no heartbeat)",
          },
        });
      } else {
        return job;
      }
    }

    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.RUNNING,
        attempts: { increment: 1 },
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
      },
    });

    const hb = setInterval(() => {
      this.prisma.job
        .update({
          where: { id: job.id },
          data: { lastHeartbeatAt: new Date() },
        })
        .catch(() => {});
    }, 15000);

    try {
      await graph.invoke(
        { _storeId: storeId },
        {
          configurable: {
            prisma: this.prisma,
            shopify: this.shopify,
            jobId: job.id,
            catalog: this.catalog,
          },
        },
      );

      const finished = new Date();
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.SUCCESS, finishedAt: finished },
      });

      return { id: job.id, status: JobStatus.SUCCESS, finishedAt: finished };
    } catch (err: any) {
      const finished = new Date();
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          finishedAt: finished,
          error: String(err?.message ?? err).slice(0, 1000),
        },
      });
      throw err;
    } finally {
      clearInterval(hb);
      await this.prisma.job.updateMany({
        where: { id: job.id, status: JobStatus.RUNNING },
        data: {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
          error: "Process terminated without finalization",
        },
      });
    }
  }
}
