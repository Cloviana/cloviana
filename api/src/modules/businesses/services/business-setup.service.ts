import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import { BusinessesProducer } from "@/infrastructure/messaging/producers/businesses.producer";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { BadRequestException, Injectable } from "@nestjs/common";
import { BusinessSetupStatus, BusinessSetupStep, Prisma } from "@prisma/client";

import { StartBusinessSetupDto } from "../dto/start-business-setup.dto";
import { UpdateBusinessSetupCompetitorsDto } from "../dto/update-business-setup-competitors.dto";
import { assertSetupCanBeCompleted } from "../helpers/business-setup";
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

@Injectable()
export class BusinessSetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessResearch: BusinessResearchService,
    private readonly businessesProducer: BusinessesProducer,
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
    const domain = normalizeDomain(dto.domain);
    if (!domain) {
      throw new BadRequestException("Please enter a valid domain name");
    }

    const enrichment = await this.businessResearch.enrichProfile(domain);
    const { name, category, description, icp } = enrichment;

    return this.prisma.business.create({
      data: {
        ownerId: user.sub,
        domain,
        name,
        category,
        description,
        icp,
        status: "LOCKED",
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.COMPETITORS,
      },
    });
  }

  async getSetup(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: ownerAccessibleBusinessWhere(user.sub, businessId),
      include: {
        competitors: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return {
      business,
      shouldCollectHeardAboutUs: false,
    };
  }

  async getCompetitorSuggestions(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: ownerAccessibleBusinessWhere(user.sub, businessId),
      select: {
        domain: true,
        name: true,
        description: true,
        icp: true,
      },
    });

    const domains = await this.businessResearch.findCompetitors(
      business.domain,
    );

    return {
      suggestions: domains.map((domain) => ({ domain })),
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

    if (competitorDomains.length < 3) {
      throw new BadRequestException("Please add at least 3 competitors");
    }
    if (competitorDomains.length > 5) {
      throw new BadRequestException("Please add no more than 5 competitors");
    }

    const competitors = await Promise.all(
      competitorDomains.map(async (domain) => ({
        domain,
        name: await this.businessResearch.extractBrandName(domain),
      })),
    );

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        competitors: {
          deleteMany: {},
          create: competitors,
        },
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        setupStep: BusinessSetupStep.COMPETITORS,
      },
    });
  }

  async completeSetup(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: ownerAccessibleBusinessWhere(user.sub, businessId),
      include: { competitors: { select: { id: true } } },
    });

    assertSetupCanBeCompleted(business, false, null);

    const updatedBusiness = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        setupStatus: BusinessSetupStatus.COMPLETED,
        setupStep: BusinessSetupStep.COMPLETED,
        status: "PROCESSING",
        setupCompletedAt: new Date(),
      },
    });

    try {
      await this.businessesProducer.runBusinessInitialization({ businessId });
    } catch (error) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: { status: "FAILED" },
      });
      throw error;
    }

    return updatedBusiness;
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
