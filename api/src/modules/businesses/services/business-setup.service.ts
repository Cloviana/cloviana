import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { isWorkEmail } from "@/common/email/work-email";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import { BusinessesProducer } from "@/infrastructure/messaging/producers/businesses.producer";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { MonitoringEnqueueService } from "@/modules/monitoring/services/monitoring-enqueue.service";
import type { PromptUniverse } from "@/workflows/prompt-generation/prompt-generation.types";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  BusinessSetupStatus,
  BusinessSetupStep,
  JobStatus,
  JobType,
  Prisma,
  PromptAwarenessStage,
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
    private readonly businessesProducer: BusinessesProducer,
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

    const business = await this.prisma.business.create({
      data: {
        ownerId: user.sub,
        domain,
        name: dto.brandName.trim(),
        location: dto.location.trim(),
        timezone: dto.timezone.trim(),
        status: "LOCKED",
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.PROFILE,
      },
    });

    await this.businessesProducer.runBusinessInitialization({
      businessId: business.id,
    });

    return business;
  }

  async getSetup(user: AuthUser, businessId: string) {
    const [business, promptResearchJob, brandResearchJob] = await Promise.all([
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
          progress: true,
          result: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
      this.prisma.job.findFirst({
        where: { businessId, type: JobType.BUSINESS_INITIALIZATION },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          error: true,
          progress: true,
          result: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
    ]);

    let brandResearchJobToReturn = brandResearchJob;
    if (
      !brandResearchJob &&
      !business.description &&
      business.setupStep === BusinessSetupStep.PROFILE
    ) {
      this.logger.log(
        `Self-healing: enqueuing business initialization job for businessId=${businessId} because brandResearchJob was missing.`,
      );
      await this.businessesProducer.runBusinessInitialization({
        businessId: business.id,
      });

      const freshJob = await this.prisma.job.findFirst({
        where: { businessId, type: JobType.BUSINESS_INITIALIZATION },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          error: true,
          progress: true,
          result: true,
          createdAt: true,
          finishedAt: true,
        },
      });

      if (freshJob) {
        brandResearchJobToReturn = freshJob;
      } else {
        brandResearchJobToReturn = {
          id: "synthetic-brand-init",
          status: JobStatus.PENDING,
          error: null,
          progress: {
            percent: 0,
            step: "scraping",
            title: "Initializing brand research...",
            updatedAt: new Date().toISOString(),
          } as any,
          createdAt: new Date(),
          finishedAt: null,
        } as any;
      }
    }

    let promptResearchJobToReturn = promptResearchJob;
    if (!promptResearchJob && business.setupStep === BusinessSetupStep.TOPICS) {
      this.logger.log(
        `Self-healing: enqueuing prompt generation job for businessId=${businessId} because promptResearchJob was missing.`,
      );
      await this.businessesProducer.runPromptGeneration({ businessId });

      const freshJob = await this.prisma.job.findFirst({
        where: { businessId, type: JobType.PROMPT_RESEARCH },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          error: true,
          progress: true,
          result: true,
          createdAt: true,
          finishedAt: true,
        },
      });

      if (freshJob) {
        promptResearchJobToReturn = freshJob;
      } else {
        promptResearchJobToReturn = {
          id: "synthetic-prompt-init",
          status: JobStatus.PENDING,
          error: null,
          progress: {
            percent: 0,
            step: "start",
            title: "Initializing prompt research...",
            updatedAt: new Date().toISOString(),
          } as any,
          createdAt: new Date(),
          finishedAt: null,
        } as any;
      }
    }

    const researchResult = readPromptResearchResult(
      promptResearchJobToReturn?.result ?? null,
    );

    return {
      business,
      shouldCollectHeardAboutUs: false,
      brandResearch: brandResearchJobToReturn
        ? {
            id: brandResearchJobToReturn.id,
            status: brandResearchJobToReturn.status,
            error: brandResearchJobToReturn.error,
            progress: brandResearchJobToReturn.progress,
            createdAt: brandResearchJobToReturn.createdAt,
            finishedAt: brandResearchJobToReturn.finishedAt,
          }
        : null,
      promptResearch: promptResearchJobToReturn
        ? {
            id: promptResearchJobToReturn.id,
            status: promptResearchJobToReturn.status,
            error: promptResearchJobToReturn.error,
            progress: promptResearchJobToReturn.progress,
            createdAt: promptResearchJobToReturn.createdAt,
            finishedAt: promptResearchJobToReturn.finishedAt,
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

    const existingCompetitorsCount = await this.prisma.competitor.count({
      where: { businessId },
    });

    let competitorData: { domain: string; name: string }[] = [];
    if (existingCompetitorsCount === 0) {
      const suggested = await this.businessResearch.findCompetitors(
        business.domain,
        5,
      );
      competitorData = suggested.map(({ domain, name }) => ({ domain, name }));
    }

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
        ...(existingCompetitorsCount === 0
          ? {
              competitors: {
                create: competitorData,
              },
            }
          : {}),
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.TOPICS,
      },
    });

    await this.businessesProducer.runPromptGeneration({ businessId });
    return updated;
  }

  async retryPromptResearch(user: AuthUser, businessId: string) {
    await this.findOwnerAccessibleBusiness(user.sub, businessId);
    await this.businessesProducer.runPromptGeneration({ businessId });
    return { queued: true };
  }

  async retryBrandResearch(user: AuthUser, businessId: string) {
    await this.findOwnerAccessibleBusiness(user.sub, businessId);
    await this.businessesProducer.runBusinessInitialization({ businessId });
    return { queued: true };
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

    const result = await this.prisma.$transaction(
      async (tx) => {
        await tx.prompt.deleteMany({ where: { businessId } });
        await tx.tag.deleteMany({ where: { businessId } });

        const usedClusterIds = Array.from(
          new Set(approvedPrompts.map((prompt) => prompt.clusterId)),
        );
        const clusterByTagName = new Map<
          string,
          (typeof universe.clusters)[number]
        >();
        for (const clusterId of usedClusterIds) {
          const cluster = clusterById.get(clusterId);
          if (!cluster) continue;

          if (!clusterByTagName.has(cluster.name)) {
            clusterByTagName.set(cluster.name, cluster);
          }
        }

        const createdTags = await tx.tag.createManyAndReturn({
          data: [...clusterByTagName.values()].map((cluster) => ({
            businessId,
            text: cluster.name,
          })),
          select: { id: true, text: true },
        });

        const tagIdByTagName = new Map(
          createdTags.map((tag) => [tag.text, tag.id]),
        );
        const tagIdByClusterId = new Map<string, string>();

        for (const clusterId of usedClusterIds) {
          const cluster = clusterById.get(clusterId);
          const tagId = cluster ? tagIdByTagName.get(cluster.name) : null;
          if (tagId) {
            tagIdByClusterId.set(clusterId, tagId);
          }
        }

        const promptsToCreate: {
          id: string;
          businessId: string;
          text: string;
          status: PromptStatus;
          awarenessStage: PromptAwarenessStage;
        }[] = [];
        const relationPairs: { promptId: string; tagId: string }[] = [];

        for (const prompt of approvedPrompts) {
          const tagId = tagIdByClusterId.get(prompt.clusterId);
          if (!tagId) continue;

          const promptId = randomUUID();
          promptsToCreate.push({
            id: promptId,
            businessId,
            text: prompt.text,
            status: PromptStatus.ACTIVE,
            awarenessStage: prompt.stage,
          });

          relationPairs.push({ promptId, tagId });
        }

        await tx.prompt.createMany({
          data: promptsToCreate,
        });

        if (relationPairs.length > 0) {
          const valuesSql = relationPairs
            .map(
              (_, index) =>
                `($${index * 2 + 1}::uuid, $${index * 2 + 2}::uuid)`,
            )
            .join(", ");

          const queryParameters = relationPairs.flatMap((pair) => [
            pair.promptId,
            pair.tagId,
          ]);

          await tx.$executeRawUnsafe(
            `INSERT INTO "_PromptToTag" ("A", "B") VALUES ${valuesSql}`,
            ...queryParameters,
          );
        }

        const promptIds = promptsToCreate.map((p) => p.id);

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
      },
      { timeout: 60000 },
    );

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
