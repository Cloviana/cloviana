import {
  BusinessMembershipRole,
  BusinessSetupStatus,
  Prisma,
} from "@prisma/client";

export type BusinessLookupArgs = Omit<
  Prisma.BusinessFindFirstOrThrowArgs,
  "where"
>;

export function accessibleBusinessWhere(
  profileId: string,
  businessId?: string,
): Prisma.BusinessWhereInput {
  return {
    ...(businessId ? { id: businessId } : {}),
    OR: [{ ownerId: profileId }, { members: { some: { profileId } } }],
  };
}

export function ownerAccessibleBusinessWhere(
  profileId: string,
  businessId: string,
): Prisma.BusinessWhereInput {
  return {
    id: businessId,
    OR: [
      { ownerId: profileId },
      {
        members: {
          some: {
            profileId,
            role: BusinessMembershipRole.OWNER,
          },
        },
      },
    ],
  };
}

export function completedMemberAccessibleBusinessWhere(
  profileId: string,
): Prisma.BusinessWhereInput {
  return {
    members: { some: { profileId } },
    ownerId: { not: profileId },
    setupStatus: BusinessSetupStatus.COMPLETED,
  };
}
