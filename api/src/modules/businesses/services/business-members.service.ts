import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { normalizeEmail } from "@/modules/auth/constants/access.constants";
import { BadRequestException, Injectable } from "@nestjs/common";
import { BusinessInviteStatus, BusinessMembershipRole } from "@prisma/client";

import { CreateBusinessInviteDto } from "../dto/create-business-invite.dto";

@Injectable()
export class BusinessMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(businessId: string) {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        createdAt: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
        members: {
          orderBy: { createdAt: "asc" },
          select: {
            createdAt: true,
            role: true,
            profile: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const ownerProfileId = business.owner.id;

    return [
      {
        profileId: ownerProfileId,
        email: business.owner.email,
        role: BusinessMembershipRole.OWNER,
        joinedAt: business.createdAt,
      },
      ...business.members
        .filter((member) => member.profile.id !== ownerProfileId)
        .map((member) => ({
          profileId: member.profile.id,
          email: member.profile.email,
          role: member.role,
          joinedAt: member.createdAt,
        })),
    ];
  }

  async createInvite(
    inviter: AuthUser,
    businessId: string,
    dto: CreateBusinessInviteDto,
  ) {
    const email = normalizeEmail(dto.email);
    const owner = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        owner: {
          select: {
            email: true,
          },
        },
      },
    });

    if (normalizeEmail(owner.owner.email) === email) {
      throw new BadRequestException("The business owner already has access");
    }

    const existingMember = await this.prisma.businessMember.findFirst({
      where: {
        businessId,
        profile: { email },
      },
      select: { id: true },
    });

    if (existingMember) {
      throw new BadRequestException(
        "This user is already a member of the workspace",
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    return this.prisma.businessInvite.upsert({
      where: {
        businessId_email: {
          businessId,
          email,
        },
      },
      update: {
        role: BusinessMembershipRole.MEMBER,
        status: BusinessInviteStatus.PENDING,
        invitedById: inviter.sub,
        acceptedAt: null,
        acceptedById: null,
        expiresAt,
      },
      create: {
        businessId,
        email,
        role: BusinessMembershipRole.MEMBER,
        status: BusinessInviteStatus.PENDING,
        invitedById: inviter.sub,
        expiresAt,
      },
    });
  }
}
