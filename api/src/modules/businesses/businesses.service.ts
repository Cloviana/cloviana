import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Injectable } from "@nestjs/common";
import { BrandKind, type Prisma } from "@prisma/client";

const businessBrandKitInclude = {
  select: {
    brands: {
      where: { kind: BrandKind.BUSINESS },
      orderBy: { createdAt: "asc" as const },
      take: 1,
    },
  },
};

function withBusinessBrand<
  T extends {
    id: string;
    brandKit: { brands: Array<{ name: string; domain: string }> } | null;
  },
>(record: T) {
  const { brandKit, ...business } = record;
  const brand = brandKit?.brands[0];

  if (!brand) {
    throw new Error(`Business ${record.id} is missing its BUSINESS brand`);
  }

  return { ...business, brand };
}

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
    const businesses = await this.prisma.business.findMany({
      where: buildAccessibleBusinessWhere(user.sub),
      include: { brandKit: businessBrandKitInclude },
    });

    return businesses.map(withBusinessBrand);
  }

  async getBusiness(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: buildAccessibleBusinessWhere(user.sub, businessId),
      include: {
        brandKit: businessBrandKitInclude,
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

    return withBusinessBrand(business);
  }

  async setLastAccessedBusiness(user: AuthUser, businessId: string) {
    await this.findAccessibleBusiness(user.sub, businessId);

    await this.prisma.profile.update({
      where: { id: user.sub },
      data: { lastAccessedBusinessId: businessId },
    });

    return { ok: true };
  }

  async getBusinessProfile(businessId: string) {
    const brandKit = await this.prisma.brandKit.findUniqueOrThrow({
      where: { businessId },
      select: {
        id: true,
        about: true,
        brands: {
          where: { kind: BrandKind.BUSINESS },
          select: { name: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });
    const brand = brandKit.brands[0];
    if (!brand) {
      throw new Error(`Brand kit ${brandKit.id} is missing its BUSINESS brand`);
    }

    return {
      name: brand.name,
      description: brandKit.about ?? "",
    };
  }

  private findAccessibleBusiness(profileId: string, businessId: string) {
    return this.prisma.business.findFirstOrThrow({
      where: buildAccessibleBusinessWhere(profileId, businessId),
    });
  }
}
