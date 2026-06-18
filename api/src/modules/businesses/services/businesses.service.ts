import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Injectable } from "@nestjs/common";
import {
  BusinessLookupArgs,
  accessibleBusinessWhere,
} from "../queries/business-where";

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser) {
    return this.prisma.business.findMany({
      where: accessibleBusinessWhere(user.sub),
    });
  }

  async getById(user: AuthUser, businessId: string) {
    return this.findAccessibleBusiness(user.sub, businessId, {
      include: {
        competitors: {
          orderBy: { createdAt: "asc" },
        },
        subscription: {
          select: {
            status: true,
            trialEndsAt: true,
            plan: {
              select: {
                name: true,
                stripePriceId: true,
              },
            },
          },
        },
      },
    });
  }

  async markLastAccessed(user: AuthUser, businessId: string) {
    await this.findAccessibleBusiness(user.sub, businessId);

    await this.prisma.profile.update({
      where: { id: user.sub },
      data: { lastAccessedBusinessId: businessId },
    });

    return { ok: true };
  }

  async update(
    user: AuthUser,
    businessId: string,
    dto: {
      name?: string;
      domain?: string;
      profileUrl?: string;
      description?: string;
      category?: string;
      icp?: string;
      location?: string;
      competitors?: string[];
    },
  ) {
    await this.findAccessibleBusiness(user.sub, businessId);

    const { competitors, ...rest } = dto;

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        ...rest,
        ...(competitors !== undefined
          ? {
              competitors: {
                deleteMany: {},
                create: competitors.map((domain) => ({
                  domain,
                  name: domain.split(".")[0] || domain,
                })),
              },
            }
          : {}),
      },
      include: {
        competitors: true,
      },
    });
  }

  private findAccessibleBusiness(
    profileId: string,
    businessId: string,
    args?: BusinessLookupArgs,
  ) {
    return this.prisma.business.findFirstOrThrow({
      ...args,
      where: accessibleBusinessWhere(profileId, businessId),
    });
  }
}
