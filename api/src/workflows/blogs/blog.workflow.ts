import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/config/app.configuration";
import { parseSseBlock } from "@/modules/chat/chat.service";
import { JobsService } from "@/modules/jobs/jobs.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { BlogDraftStatus, Prisma } from "@prisma/client";

const INACTIVITY_MS = 180_000;
const HARD_CAP_MS = 30 * 60 * 1000;
// Blog runs take many minutes; keep the job fresh well past stage gaps.
const BLOG_STALE_MS = 5 * 60 * 1000;

type DonePayload = {
  title?: string;
  markdown?: string;
  sources?: unknown;
  violations?: unknown[];
  revisions?: number;
};

type BlogRunResult = {
  draftId: string;
  title: string;
  status: BlogDraftStatus;
  revisions: number;
};

@Injectable()
export class BlogWorkflow {
  private readonly logger = new Logger(BlogWorkflow.name);
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    private readonly jobsService: JobsService,
    config: AppConfiguration,
  ) {
    this.baseUrl = `${config.agentUrl.replace(/\/$/, "")}/`;
  }

  async run(
    jobId: string,
    businessId: string,
    topic: string,
    instructions?: string,
  ) {
    return this.managedJobs.runJob<BlogRunResult>({
      jobId,
      staleMs: BLOG_STALE_MS,
      execute: () => this.execute(jobId, businessId, topic, instructions),
      serializeResult: (result) => result as unknown as Prisma.InputJsonValue,
    });
  }

  private async execute(
    jobId: string,
    businessId: string,
    topic: string,
    instructions?: string,
  ): Promise<BlogRunResult> {
    const controller = new AbortController();
    let watchdog = setTimeout(() => controller.abort(), INACTIVITY_MS);
    const hardCap = setTimeout(() => controller.abort(), HARD_CAP_MS);
    const kick = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => controller.abort(), INACTIVITY_MS);
    };

    let done: DonePayload | undefined;
    const stages: Record<string, unknown>[] = [];

    try {
      const response = await fetch(new URL("agent/blog/stream", this.baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, topic, instructions }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Agent blog stream returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        kick();
        buffer += decoder.decode(value, { stream: true });
        let separator = buffer.indexOf("\n\n");
        while (separator >= 0) {
          const block = buffer.slice(0, separator);
          buffer = buffer.slice(separator + 2);
          const event = parseSseBlock(block);
          separator = buffer.indexOf("\n\n");
          if (!event) continue;

          if (event.event === "stage") {
            const data = event.data as Record<string, unknown>;
            this.logger.log(
              `Blog job=${jobId} stage=${data.index}/9 key=${data.key} status=${data.status}`,
            );
            stages.push({
              index: data.index,
              key: data.key,
              status: data.status,
              detail: data.detail || "",
              results: (data as { results?: unknown[] }).results || [],
              at: new Date().toISOString(),
            });
            await this.jobsService
              .setRuntime(jobId, {
                percent: Math.round((Number(data.index) / 9) * 100),
                step: String(data.key ?? ""),
                title: topic,
                meta: {
                  detail: data.detail,
                  stageStatus: data.status,
                  stages,
                },
              })
              .catch(() => {});
          } else if (event.event === "done") {
            done = event.data as DonePayload;
          } else if (event.event === "error") {
            const data = event.data as { stage?: unknown; detail?: unknown };
            throw new Error(
              `Blog pipeline failed at stage=${data.stage}: ${data.detail}`,
            );
          }
        }
      }
    } finally {
      clearTimeout(watchdog);
      clearTimeout(hardCap);
    }

    if (!done?.markdown) {
      throw new Error("Agent blog stream ended without a result");
    }

    const violations = Array.isArray(done.violations) ? done.violations : [];
    const draft = await this.prisma.blogDraft.create({
      data: {
        businessId,
        jobId,
        title: done.title || topic,
        body: done.markdown,
        // ponytail: hard gate in blog.py means we only get here if critic passed
        status: BlogDraftStatus.READY,
        violations: violations as Prisma.InputJsonValue,
        sources: (done.sources ?? []) as Prisma.InputJsonValue,
      },
    });

    return {
      draftId: draft.id,
      title: draft.title,
      status: draft.status,
      revisions: done.revisions ?? 0,
    };
  }
}
