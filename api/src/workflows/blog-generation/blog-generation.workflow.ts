import { PrismaService } from "@/clients/prisma/prisma.service";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { JobsService } from "@/modules/jobs/jobs.service";
import { makeDedupeKey } from "@/utils/job.util";
import { Injectable } from "@nestjs/common";
import { JobStatus, JobType } from "@prisma/client";
import { graph } from "./blog-generation.graph";

const STALE_MS = 10 * 60 * 1000;

@Injectable()
export class BlogGenerationWorkflow {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly jobs: JobsService,
  ) {}

  async run(blogId: string) {
    const now = new Date();

    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      include: { job: true },
    });

    const key = makeDedupeKey(JobType.BLOG_GENERATION, blogId, now);

    let job = blog.job ?? null;

    if (job) {
      if (job.status === JobStatus.RUNNING) {
        const last = job.lastHeartbeatAt?.getTime() ?? 0;
        if (Date.now() - last <= STALE_MS) return job;
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            finishedAt: now,
            error: "Stale running job (no heartbeat)",
          },
        });
        await this.jobs.setRuntime(job.id, {
          status: JobStatus.FAILED,
          percent: 100,
          title: "Generation failed",
        });
        job = null;
      } else if (job.status === JobStatus.PENDING) {
        job = await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.RUNNING,
            attempts: { increment: 1 },
            startedAt: now,
            lastHeartbeatAt: now,
          },
        });
      } else if (job.status === JobStatus.SUCCESS && job.dedupeKey === key) {
        return job;
      } else {
        job = null;
      }
    }

    if (!job) {
      job = await this.prisma.job.upsert({
        where: {
          type_storeId_dedupeKey: {
            type: JobType.BLOG_GENERATION,
            storeId: blog.storeId,
            dedupeKey: key,
          },
        },
        update: {},
        create: {
          type: JobType.BLOG_GENERATION,
          storeId: blog.storeId,
          status: JobStatus.PENDING,
          dedupeKey: key,
        },
      });

      if (blog.jobId !== job.id) {
        await this.prisma.blog.update({
          where: { id: blogId },
          data: { jobId: job.id },
        });
      }

      job = await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.RUNNING,
          attempts: { increment: 1 },
          startedAt: now,
          lastHeartbeatAt: now,
        },
      });
    }

    await this.jobs.setRuntime(job.id, {
      status: JobStatus.RUNNING,
      percent: 0,
      title: "Starting blog generation",
    });

    const hb = setInterval(() => {
      this.prisma.job
        .update({
          where: { id: job!.id },
          data: { lastHeartbeatAt: new Date() },
        })
        .catch(() => {});
    }, 15000);

    try {
      await graph.invoke(
        { _blogId: blogId, _storeId: blog.storeId },
        {
          configurable: {
            prisma: this.prisma,
            jobId: job.id,
            storage: this.storage,
            jobs: this.jobs,
          },
          recursionLimit: 250,
        },
      );

      const finished = new Date();
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.SUCCESS, finishedAt: finished },
      });

      await this.jobs.setRuntime(job.id, {
        status: JobStatus.SUCCESS,
        percent: 100,
        title: "Blog generated",
      });

      return {
        id: job.id,
        status: JobStatus.SUCCESS,
        finishedAt: finished,
      };
    } catch (err: any) {
      const finished = new Date();
      const message = String(err?.message ?? err).slice(0, 1000);

      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          finishedAt: finished,
          error: message,
        },
      });

      await this.jobs.setRuntime(job.id, {
        status: JobStatus.FAILED,
        percent: 100,
        title: "Generation failed",
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
