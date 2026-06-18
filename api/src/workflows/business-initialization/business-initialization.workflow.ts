import { PrismaService } from "@/clients/prisma/prisma.service";
import { BusinessResearchService } from "@/modules/businesses/services/business-research.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobType } from "@prisma/client";

const DEDUPE_KEY = "setup-completion";

@Injectable()
export class BusinessInitializationWorkflow {
  private readonly logger = new Logger(BusinessInitializationWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    private readonly businessResearch: BusinessResearchService,
  ) {}

  async run(businessId: string) {
    await this.prisma.business.update({
      where: { id: businessId },
      data: { status: "PROCESSING" },
    });

    return this.managedJobs.runJobInline({
      type: JobType.BUSINESS_INITIALIZATION,
      businessId,
      dedupeKey: `${DEDUPE_KEY}:${businessId}`,
      execute: async ({ jobId }) => {
        const business = await this.prisma.business.findUniqueOrThrow({
          where: { id: businessId },
        });

        this.logger.log(`Starting brand research for businessId=${businessId}`);

        await this.managedJobs.updateProgress(jobId, {
          step: "scraping",
          percent: 25,
          title: "Analyzing homepage and domain...",
        });

        const enrichment = await this.businessResearch.enrichProfile(
          business.domain,
        );

        await this.managedJobs.updateProgress(jobId, {
          step: "competitors",
          percent: 50,
          title: "Finding main competitors...",
        });

        const competitors = await this.businessResearch.findCompetitors(
          business.domain,
          5,
        );

        await this.managedJobs.updateProgress(jobId, {
          step: "extracting",
          percent: 75,
          title: "Extracting brand profile...",
        });

        await this.prisma.$transaction(async (tx) => {
          await tx.business.update({
            where: { id: businessId },
            data: {
              name: business.name || enrichment.name,
              category: enrichment.category,
              description: enrichment.description,
              icp: enrichment.icp,
            },
          });

          await tx.competitor.deleteMany({
            where: { businessId },
          });

          await tx.competitor.createMany({
            data: competitors.map(({ domain, name }) => ({
              businessId,
              domain,
              name,
            })),
            skipDuplicates: true,
          });
        });

        await this.managedJobs.updateProgress(jobId, {
          step: "complete",
          percent: 100,
          title: "Brand profile research complete",
        });

        return { completed: true };
      },
      onSuccess: async ({ businessId }) => {
        await this.prisma.business.update({
          where: { id: businessId },
          data: { status: "LOCKED" },
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
