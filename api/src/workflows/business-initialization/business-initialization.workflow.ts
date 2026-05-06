import { PrismaService } from "@/clients/prisma/prisma.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobType } from "@prisma/client";
import { graph } from "./business-initialization.graph";

const DEDUPE_KEY = "setup-completion";

@Injectable()
export class BusinessInitializationWorkflow {
  private readonly logger = new Logger(BusinessInitializationWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
  ) {}

  async run(businessId: string) {
    await this.prisma.business.update({
      where: { id: businessId },
      data: { status: "PROCESSING" },
    });

    return this.managedJobs.runManagedBusinessJob({
      type: JobType.BUSINESS_INITIALIZATION,
      businessId,
      dedupeKey: DEDUPE_KEY,
      execute: async () => {
        const stream = graph.streamEvents(
          { _businessId: businessId },
          {
            version: "v2",
            configurable: {
              logger: this.logger,
            },
          },
        );

        for await (const event of stream) {
          if (event.event === "on_chain_start" && event.name) {
            this.logger.log(`[${businessId}] ▶ ${event.name}`);
          }
          if (event.event === "on_chain_end" && event.name) {
            this.logger.log(`[${businessId}] ✓ ${event.name}`);
          }
        }

        return { completedSteps: ["PROMPT_RESEARCH"] };
      },
      onSuccess: async ({ businessId }) => {
        await this.prisma.business.update({
          where: { id: businessId },
          data: { status: "ACTIVE" },
        });
      },
      onFailure: async ({ businessId }) => {
        await this.prisma.business.update({
          where: { id: businessId },
          data: { status: "FAILED" },
        });
      },
      serializeResult: (result) => result,
    });
  }
}
