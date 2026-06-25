import { PrismaService } from "@/clients/prisma/prisma.service";
import { isWorkEmail } from "@/common/email/work-email";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { MonitoringEnqueueService } from "@/modules/monitoring/services/monitoring-enqueue.service";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  BusinessSetupStatus,
  BusinessSetupStep,
  JobStatus,
  JobType,
  Prisma,
  PromptStatus,
} from "@prisma/client";

import { CompleteBusinessSetupDto } from "../dto/complete-business-setup.dto";
import { StartBusinessSetupDto } from "../dto/start-business-setup.dto";
import { UpdateBusinessSetupCompetitorsDto } from "../dto/update-business-setup-competitors.dto";
import { UpdateBusinessSetupProfileDto } from "../dto/update-business-setup-profile.dto";
import { UpdateBusinessSetupTopicsDto } from "../dto/update-business-setup-topics.dto";
import {
  completedMemberAccessibleBusinessWhere,
  ownerAccessibleBusinessWhere,
} from "../queries/business-where";
import { BusinessResearchService } from "./business-research.service";

const businessIdSelect = { id: true } as const;

type EntryDestination = {
  destination: "setup" | "business";
  businessId: string | null;
};

type PromptResearchResult = {
  businessId: string;
  promptUniverse: PromptUniverse;
};

type PromptCluster = {
  id: string;
  name: string;
  description?: string;
};

type GeneratedPrompt = {
  id: string;
  clusterId: string;
  text: string;
  stage: string;
};

type PromptUniverse = {
  clusters: PromptCluster[];
  prompts: GeneratedPrompt[];
};

function readPromptResearchResult(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result = value as Record<string, unknown>;
  const promptUniverse = result.promptUniverse;

  if (
    !promptUniverse ||
    typeof promptUniverse !== "object" ||
    Array.isArray(promptUniverse)
  ) {
    return null;
  }

  const universe = promptUniverse as Record<string, unknown>;
  if (!Array.isArray(universe.clusters) || !Array.isArray(universe.prompts)) {
    return null;
  }

  return result as unknown as PromptResearchResult;
}

@Injectable()
export class BusinessSetupService {
  private readonly logger = new Logger(BusinessSetupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessResearch: BusinessResearchService,
    private readonly monitoringEnqueue: MonitoringEnqueueService,
  ) {}

  async getEntry(user: AuthUser): Promise<EntryDestination> {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: user.sub },
      select: { lastAccessedBusinessId: true },
    });

    if (profile.lastAccessedBusinessId) {
      const lastAccessedBusiness = await this.prisma.business.findFirst({
        where: {
          id: profile.lastAccessedBusinessId,
          OR: [
            { ownerId: user.sub, setupStatus: BusinessSetupStatus.COMPLETED },
            completedMemberAccessibleBusinessWhere(user.sub),
          ],
        },
        select: businessIdSelect,
      });

      if (lastAccessedBusiness) {
        return { destination: "business", businessId: lastAccessedBusiness.id };
      }
    }

    const [
      completedOwnedBusiness,
      memberAccessibleBusiness,
      inProgressOwnedBusiness,
    ] = await Promise.all([
      this.findLatestBusiness({
        ownerId: user.sub,
        setupStatus: BusinessSetupStatus.COMPLETED,
      }),
      this.findLatestBusiness({
        ...completedMemberAccessibleBusinessWhere(user.sub),
      }),
      this.findLatestBusiness({
        ownerId: user.sub,
        setupStatus: { not: BusinessSetupStatus.COMPLETED },
      }),
    ]);

    if (completedOwnedBusiness) {
      return { destination: "business", businessId: completedOwnedBusiness.id };
    }

    if (memberAccessibleBusiness) {
      return {
        destination: "business",
        businessId: memberAccessibleBusiness.id,
      };
    }

    if (inProgressOwnedBusiness) {
      return { destination: "setup", businessId: inProgressOwnedBusiness.id };
    }

    return { destination: "setup", businessId: null };
  }

  async startSetup(user: AuthUser, dto: StartBusinessSetupDto) {
    const workEmail = dto.workEmail.trim().toLowerCase();
    const authenticatedEmail = user.email.trim().toLowerCase();

    if (workEmail !== authenticatedEmail) {
      throw new BadRequestException(
        "The project email must match your authenticated work email",
      );
    }

    if (!isWorkEmail(workEmail)) {
      throw new BadRequestException("Please use a work email address");
    }

    const existingSetup = await this.findLatestBusiness({
      ownerId: user.sub,
      setupStatus: { not: BusinessSetupStatus.COMPLETED },
    });
    if (existingSetup) {
      return this.prisma.business.findUniqueOrThrow({
        where: { id: existingSetup.id },
      });
    }

    const domain = normalizeDomain(dto.domain);
    if (!domain) {
      throw new BadRequestException("Please enter a valid domain name");
    }

    const enrichment = await this.businessResearch.enrichProfile(domain);

    return this.prisma.business.create({
      data: {
        ownerId: user.sub,
        domain,
        name: dto.brandName.trim() || enrichment.name,
        category: enrichment.category,
        description: enrichment.description,
        icp: enrichment.icp,
        location: dto.location.trim(),
        timezone: dto.timezone.trim(),
        status: "LOCKED",
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.PROFILE,
      },
    });
  }

  async getSetup(user: AuthUser, businessId: string) {
    const [business, promptResearchJob] = await Promise.all([
      this.prisma.business.findFirstOrThrow({
        where: ownerAccessibleBusinessWhere(user.sub, businessId),
        include: {
          competitors: { orderBy: { createdAt: "asc" } },
        },
      }),
      this.prisma.job.findFirst({
        where: { businessId, type: JobType.PROMPT_RESEARCH },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          error: true,
          result: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
    ]);

    const researchResult = readPromptResearchResult(
      promptResearchJob?.result ?? null,
    );

    return {
      business,
      shouldCollectHeardAboutUs: false,
      promptResearch: promptResearchJob
        ? {
            id: promptResearchJob.id,
            status: promptResearchJob.status,
            error: promptResearchJob.error,
            createdAt: promptResearchJob.createdAt,
            finishedAt: promptResearchJob.finishedAt,
            promptUniverse: researchResult?.promptUniverse ?? null,
          }
        : null,
    };
  }

  async updateSetupProfile(
    user: AuthUser,
    businessId: string,
    dto: UpdateBusinessSetupProfileDto,
  ) {
    const business = await this.findOwnerAccessibleBusiness(
      user.sub,
      businessId,
    );
    if (dto.searchIntentCommercial + dto.searchIntentInformational !== 100) {
      throw new BadRequestException(
        "Commercial and informational intent must total 100",
      );
    }

    const competitors = await this.businessResearch.findCompetitors(
      business.domain,
      5,
    );
    const distributionChannels = Array.from(
      new Set(dto.distributionChannels.map((channel) => channel.trim())),
    ).filter(Boolean);

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        description: dto.description.trim(),
        industry: dto.industry,
        category: dto.category.trim(),
        distributionChannels,
        searchIntentCommercial: dto.searchIntentCommercial,
        searchIntentInformational: dto.searchIntentInformational,
        selectedTopicIds: [],
        competitors: {
          deleteMany: {},
          create: competitors.map(({ domain, name }) => ({ domain, name })),
        },
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.TOPICS,
      },
    });

    return updated;
  }

  async retryPromptResearch(user: AuthUser, businessId: string) {
    await this.findOwnerAccessibleBusiness(user.sub, businessId);
    return { queued: false };
  }

  async updateSetupTopics(
    user: AuthUser,
    businessId: string,
    dto: UpdateBusinessSetupTopicsDto,
  ) {
    await this.findOwnerAccessibleBusiness(user.sub, businessId);
    const universe = await this.getSuccessfulPromptUniverse(businessId);
    const validClusterIds = new Set(
      universe.clusters.map((cluster) => cluster.id),
    );
    const selectedTopicIds = Array.from(new Set(dto.topicIds));

    if (selectedTopicIds.some((topicId) => !validClusterIds.has(topicId))) {
      throw new BadRequestException("One or more selected topics are invalid");
    }

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        selectedTopicIds,
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.PROMPTS,
      },
    });
  }

  async completeSetup(
    user: AuthUser,
    businessId: string,
    dto: CompleteBusinessSetupDto,
  ) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: ownerAccessibleBusinessWhere(user.sub, businessId),
      include: { competitors: { select: { id: true } } },
    });

    if (business.setupStatus === BusinessSetupStatus.COMPLETED) {
      return business;
    }
    const universe = await this.getSuccessfulPromptUniverse(businessId);
    const selectedTopicIds = new Set(business.selectedTopicIds);
    const clusterById = new Map(
      universe.clusters.map((cluster) => [cluster.id, cluster]),
    );

    if (selectedTopicIds.size === 0) {
      throw new BadRequestException("Select at least one topic");
    }

    const seenPromptText = new Set<string>();
    const approvedPrompts = dto.prompts
      .map((prompt) => ({ ...prompt, text: prompt.text.trim() }))
      .filter((prompt) => {
        if (
          !selectedTopicIds.has(prompt.clusterId) ||
          !clusterById.has(prompt.clusterId)
        ) {
          throw new BadRequestException(
            "Every approved prompt must belong to a selected topic",
          );
        }

        const normalizedText = prompt.text.toLowerCase();
        if (seenPromptText.has(normalizedText)) {
          return false;
        }

        seenPromptText.add(normalizedText);
        return true;
      });

    if (approvedPrompts.length < 3) {
      throw new BadRequestException("Approve at least 3 unique prompts");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.prompt.deleteMany({ where: { businessId } });
      await tx.tag.deleteMany({ where: { businessId } });

      const usedClusterIds = Array.from(
        new Set(approvedPrompts.map((prompt) => prompt.clusterId)),
      );
      const tagIdByClusterId = new Map<string, string>();
      const tagIdByTagName = new Map<string, string>();

      for (const clusterId of usedClusterIds) {
        const cluster = clusterById.get(clusterId);
        if (!cluster) continue;

        let tagId = tagIdByTagName.get(cluster.name);
        if (!tagId) {
          const tag = await tx.tag.create({
            data: { businessId, text: cluster.name },
            select: { id: true },
          });
          tagId = tag.id;
          tagIdByTagName.set(cluster.name, tagId);
        }
        tagIdByClusterId.set(clusterId, tagId);
      }

      const promptIds: string[] = [];
      for (const prompt of approvedPrompts) {
        const tagId = tagIdByClusterId.get(prompt.clusterId);
        if (!tagId) continue;

        const created = await tx.prompt.create({
          data: {
            businessId,
            text: prompt.text,
            status: PromptStatus.ACTIVE,
            awarenessStage: prompt.stage,
            tags: { connect: { id: tagId } },
          },
          select: { id: true },
        });
        promptIds.push(created.id);
      }

      const updatedBusiness = await tx.business.update({
        where: { id: businessId },
        data: {
          setupStatus: BusinessSetupStatus.COMPLETED,
          setupStep: BusinessSetupStep.COMPLETED,
          status: "ACTIVE",
          setupCompletedAt: new Date(),
        },
      });

      return { business: updatedBusiness, promptIds };
    }, { timeout: 60000 });

    try {
      await this.monitoringEnqueue.enqueue(businessId, result.promptIds);
    } catch (error) {
      this.logger.error(
        `Initial monitoring enqueue failed for businessId=${businessId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return result.business;
  }

  async getCompetitorSuggestions(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: ownerAccessibleBusinessWhere(user.sub, businessId),
      select: { domain: true },
    });
    const competitors = await this.businessResearch.findCompetitors(
      business.domain,
      5,
    );

    return {
      suggestions: competitors.map(({ domain }) => ({ domain })),
    };
  }

  async updateSetupCompetitors(
    user: AuthUser,
    businessId: string,
    dto: UpdateBusinessSetupCompetitorsDto,
  ) {
    await this.findOwnerAccessibleBusiness(user.sub, businessId);
    const competitorDomains = Array.from(
      new Set(
        dto.competitors
          .map((competitor) => normalizeHostname(competitor))
          .filter((competitor): competitor is string => Boolean(competitor)),
      ),
    );

    const competitors = await Promise.all(
      competitorDomains.map(async (domain) => ({
        domain,
        name: await this.businessResearch.extractBrandName(domain),
      })),
    );

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        competitors: { deleteMany: {}, create: competitors },
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
      },
    });
  }

  private async getSuccessfulPromptUniverse(
    businessId: string,
  ): Promise<PromptUniverse> {
    const job = await this.prisma.job.findFirst({
      where: {
        businessId,
        type: JobType.PROMPT_RESEARCH,
        status: JobStatus.SUCCESS,
      },
      orderBy: { createdAt: "desc" },
      select: { result: true },
    });
    const result = readPromptResearchResult(job?.result ?? null);

    if (!result) {
      throw new BadRequestException(
        "Prompt research is not ready yet. Please wait and try again.",
      );
    }

    return result.promptUniverse;
  }

  private findOwnerAccessibleBusiness(profileId: string, businessId: string) {
    return this.prisma.business.findFirstOrThrow({
      where: ownerAccessibleBusinessWhere(profileId, businessId),
    });
  }

  private findLatestBusiness(where: Prisma.BusinessWhereInput) {
    return this.prisma.business.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
      select: businessIdSelect,
    });
  }
}
