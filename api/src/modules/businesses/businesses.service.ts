import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

type BusinessLookupOptions = Omit<Prisma.BusinessFindFirstOrThrowArgs, "where">;

function buildAccessibleBusinessWhere(
  profileId: string,
  businessId?: string,
): Prisma.BusinessWhereInput {
  return {
    ...(businessId ? { id: businessId } : {}),
    OR: [{ ownerId: profileId }, { members: { some: { profileId } } }],
  };
}

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEntryDestination(user: AuthUser) {
    const userProfile = await this.prisma.profile.findUnique({
      where: { id: user.sub },
      select: { lastAccessedBusinessId: true },
    });

    if (userProfile?.lastAccessedBusinessId) {
      const lastAccessedBusiness = await this.prisma.business.findFirst({
        where: buildAccessibleBusinessWhere(
          user.sub,
          userProfile.lastAccessedBusinessId,
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

    const firstAccessibleBusiness = await this.prisma.business.findFirst({
      where: buildAccessibleBusinessWhere(user.sub),
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return {
      destination: "business" as const,
      businessId: firstAccessibleBusiness?.id ?? null,
    };
  }

  async listBusinesses(user: AuthUser) {
    return this.prisma.business.findMany({
      where: buildAccessibleBusinessWhere(user.sub),
    });
  }

  async getBusiness(user: AuthUser, businessId: string) {
    return this.findAccessibleBusiness(user.sub, businessId, {
      include: {
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

  async setLastAccessedBusiness(user: AuthUser, businessId: string) {
    await this.findAccessibleBusiness(user.sub, businessId);

    await this.prisma.profile.update({
      where: { id: user.sub },
      data: { lastAccessedBusinessId: businessId },
    });

    return { ok: true };
  }

  getBusinessProfile(businessId: string) {
    return this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { name: true, description: true },
    });
  }

  private findAccessibleBusiness(
    profileId: string,
    businessId: string,
    options?: BusinessLookupOptions,
  ) {
    return this.prisma.business.findFirstOrThrow({
      ...options,
      where: buildAccessibleBusinessWhere(profileId, businessId),
    });
  }
}
