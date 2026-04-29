import { PrismaService } from "@/clients/prisma/prisma.service";
import { BusinessResearchService } from "@/modules/businesses/services/business-research.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobType } from "@prisma/client";
import type { PromptResearchInput } from "./prompt-research.schemas";
import { PromptResearchWorkflow } from "./prompt-research.workflow";

const DEDUPE_KEY = "business-initialization";

@Injectable()
export class PromptResearchRunner {
  private readonly logger = new Logger(PromptResearchRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    private readonly promptResearchWorkflow: PromptResearchWorkflow,
    private readonly businessResearch: BusinessResearchService,
  ) {}

  async run(businessId: string) {
    return this.managedJobs.runManagedBusinessJob({
      type: JobType.PROMPT_RESEARCH,
      businessId,
      dedupeKey: DEDUPE_KEY,
      execute: async () => {
        this.logger.log(
          `Starting prompt research for businessId=${businessId}`,
        );

        const input = await this.buildInput(businessId);
        return this.promptResearchWorkflow.run(input);
      },
      onSuccess: async ({ businessId, result }) => {
        await this.prisma.$transaction([
          this.prisma.prompt.deleteMany({
            where: { businessId },
          }),
          this.prisma.prompt.createMany({
            data: result.prompts.map((prompt) => ({
              businessId,
              text: prompt.prompt,
              awarenessStage: prompt.awarenessStage,
              status: prompt.active ? "ACTIVE" : "INACTIVE",
            })),
          }),
        ]);
      },
      serializeResult: (result) => ({
        totalPrompts: result.prompts.length,
        activePrompts: result.prompts.filter((p) => p.active).length,
        inactivePrompts: result.prompts.filter((p) => !p.active).length,
      }),
    });
  }

  private async buildInput(businessId: string): Promise<PromptResearchInput> {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      include: {
        competitors: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const hasProfile =
      !!business.name.trim() &&
      !!business.category?.trim() &&
      !!business.description?.trim() &&
      !!business.icp?.trim();

    const enrichment = hasProfile
      ? null
      : await this.businessResearch.enrichProfile(business.domain);

    const brand = business.name.trim() || enrichment?.name || business.domain;
    const category = business.category?.trim() || enrichment?.category || "";
    const description =
      business.description?.trim() || enrichment?.description || "";
    const icp = business.icp?.trim() || enrichment?.icp || "";

    if (!hasProfile && enrichment) {
      await this.prisma.business.update({
        where: { id: business.id },
        data: {
          name: brand,
          category,
          description,
          icp,
        },
      });
    }

    const competitors = await Promise.all(
      business.competitors.map((competitor) =>
        this.resolveCompetitorName(competitor.domain),
      ),
    );

    return {
      brand,
      category,
      description,
      icp,
      competitors,
    };
  }

  private async resolveCompetitorName(domain: string): Promise<string> {
    try {
      const profile = await this.businessResearch.enrichProfile(domain);
      return profile.name.trim() || domain;
    } catch {
      this.logger.warn(
        `Competitor profile enrichment failed for ${domain}; using domain fallback.`,
      );
      return domain;
    }
  }
}
