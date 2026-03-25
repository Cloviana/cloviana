import { GroqClient } from "@/clients/groq/groq.client";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobStatus, JobType } from "@prisma/client";
import { graph } from "./audit.graph";

@Injectable()
export class AuditWorkflow {
  private readonly logger = new Logger(AuditWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqClient,
    private readonly resend: ResendService,
    private readonly exa: ExaService,
    private readonly dataForSeo: DataForSeoService,
  ) {}

  async run(auditId: string) {
    const audit = await this.prisma.audit.findUniqueOrThrow({
      where: { id: auditId },
    });

    this.logger.log(`Starting audit ${auditId} for ${audit.domain}`);

    // Each audit gets its own job — no dedup needed
    const job = await this.prisma.job.create({
      data: {
        type: JobType.SITE_AUDIT,
        status: JobStatus.RUNNING,
        attempts: 1,
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        audits: { connect: { id: auditId } },
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
      const stream = graph.streamEvents(
        { _auditId: auditId, _email: audit.email, _domain: audit.domain },
        {
          version: "v2",
          configurable: {
            prisma: this.prisma,
            groq: this.groq,
            resend: this.resend,
            exa: this.exa,
            dataForSeo: this.dataForSeo,
            jobId: job.id,
            logger: this.logger,
          },
        },
      );

      for await (const event of stream) {
        if (event.event === "on_chain_start" && event.name) {
          this.logger.log(`[${auditId}] ▶ ${event.name}`);
        }
        if (event.event === "on_chain_end" && event.name) {
          this.logger.log(`[${auditId}] ✓ ${event.name}`);
        }
      }

      const finished = new Date();
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.SUCCESS, finishedAt: finished },
      });

      this.logger.log(`Audit ${auditId} completed successfully`);
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
      this.logger.error(
        `Audit ${auditId} failed: ${err?.message}`,
        err?.stack,
      );
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
