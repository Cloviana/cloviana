import { createHash } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { BlogsProducer } from "@/infrastructure/messaging/producers/blogs.producer";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { JobType } from "@prisma/client";

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    private readonly blogsProducer: BlogsProducer,
  ) {}

  async generate(businessId: string, topic: string, instructions?: string) {
    // ponytail: hour bucket in the dedupe key — blocks double-clicks, allows
    // regenerating the same topic later
    const hash = createHash("sha1")
      .update(`${topic}\n${instructions ?? ""}`)
      .digest("hex");
    const dedupeKey = `${hash}:${new Date().toISOString().slice(0, 13)}`;

    const reservation = await this.managedJobs.reserveJob({
      type: JobType.BLOG_GENERATION,
      businessId,
      dedupeKey,
      payload: { topic, instructions },
    });

    if (reservation.shouldPublish) {
      await this.blogsProducer.runBlogGeneration({
        jobId: reservation.jobId,
        businessId,
        topic,
        instructions,
      });
      this.logger.log(
        `Enqueued blog generation businessId=${businessId} jobId=${reservation.jobId}`,
      );
    }

    return { jobId: reservation.jobId, enqueued: reservation.shouldPublish };
  }

  listDrafts(businessId: string) {
    return this.prisma.blogDraft.findMany({
      where: { businessId },
      select: {
        id: true,
        jobId: true,
        title: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDraft(businessId: string, draftId: string) {
    const draft = await this.prisma.blogDraft.findFirst({
      where: { id: draftId, businessId },
    });
    if (!draft) throw new NotFoundException("Draft not found");
    return draft;
  }
}
