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

  async getEntry(user: AuthUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: user.sub },
      select: { lastAccessedBusinessId: true },
    });

    if (profile?.lastAccessedBusinessId) {
      const lastAccessedBusiness = await this.prisma.business.findFirst({
        where: accessibleBusinessWhere(
          user.sub,
          profile.lastAccessedBusinessId,
        ),
        select: { id: true },
      });

      if (lastAccessedBusiness) {
        return {
          destination: "business" as const,
          businessId: lastAccessedBusiness.id,
        };
      }
    }

    const business = await this.prisma.business.findFirst({
      where: accessibleBusinessWhere(user.sub),
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return {
      destination: "business" as const,
      businessId: business?.id ?? null,
    };
  }

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
