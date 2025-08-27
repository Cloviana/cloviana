import { Injectable } from "@nestjs/common";
import { graph } from "./blog-generation.graph";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { JobStatus, JobType } from "@prisma/client";

const STALE_MS = 10 * 60 * 1000;

@Injectable()
export class BlogGenerationWorkflow {
  constructor(private readonly prisma: PrismaService) {}

  async run(blogId: string) {
    const { storeId } = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
    });

    const key = `${JobType.BLOG_GENERATION}:${storeId}:${new Date().toISOString().slice(0, 10)}`;

    let job = await this.prisma.job.upsert({
      where: {
        type_storeId_dedupeKey: {
          type: JobType.BLOG_GENERATION,
          storeId,
          dedupeKey: key,
        },
      },
      update: {},
      create: {
        type: JobType.BLOG_GENERATION,
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
      const { _nodes, _image } = await graph.invoke(
        { _blogId: blogId, _storeId: storeId },
        {
          configurable: {
            prisma: this.prisma,
            jobId: job.id,
          },
        },
      );

      const finished = new Date();
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.SUCCESS, finishedAt: finished },
      });

      return {
        id: job.id,
        status: JobStatus.SUCCESS,
        finishedAt: finished,
        nodes: _nodes,
        image: _image,
      };
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
