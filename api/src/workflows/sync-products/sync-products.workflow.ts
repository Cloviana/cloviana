import { Injectable } from "@nestjs/common";
import { graph } from "./sync-products.graph";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import { JobStatus, JobType } from "@prisma/client";

@Injectable()
export class SyncProductsWorkflow {
  constructor(private readonly prisma: PrismaService, private readonly shopify: ShopifyService) {}

  async run(storeId: string) {
    const key = `PRODUCT_SYNC:${storeId}:${new Date().toISOString().slice(0,10)}`;

    const job = await this.prisma.job.upsert({
      where: { type_storeId_dedupeKey: { type: JobType.PRODUCT_SYNC, storeId, dedupeKey: key } },
      update: {},
      create: {
        type: JobType.PRODUCT_SYNC,
        storeId,
        status: JobStatus.PENDING,
        dedupeKey: key,
      },
    });

    if (job.status === JobStatus.RUNNING) return job;

    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.RUNNING,
        attempts: { increment: 1 },
        startedAt: new Date(),
      },
    });

    try {
      await graph.invoke(
        { _storeId: storeId },
        { configurable: { prisma: this.prisma, shopify: this.shopify, jobId: job.id } }
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
    }
  }
}
