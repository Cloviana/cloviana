import { PrismaService } from "@/clients/prisma/prisma.service";
import { isWorkEmail } from "@/common/email/work-email";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { BusinessInviteStatus } from "@prisma/client";
import { ADMIN_EMAIL, normalizeEmail } from "./constants/access.constants";

type AuthAccessReason =
  | "admin"
  | "owner"
  | "member"
  | "invite"
  | "business_email"
  | "personal_email"
  | "denied";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  isAdminEmail(email: string) {
    return normalizeEmail(email) === ADMIN_EMAIL;
  }

  async getAccessByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);

    if (this.isAdminEmail(normalizedEmail)) {
      return { allowed: true, reason: "admin" as AuthAccessReason };
    }

    const profile = await this.prisma.profile.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (profile) {
      const [ownsBusinesses, hasMembership] = await Promise.all([
        this.prisma.business.count({ where: { ownerId: profile.id } }),
        this.prisma.businessMember.count({ where: { profileId: profile.id } }),
      ]);

      if (ownsBusinesses > 0) {
        return { allowed: true, reason: "owner" as AuthAccessReason };
      }

      if (hasMembership > 0) {
        return { allowed: true, reason: "member" as AuthAccessReason };
      }
    }

    const now = new Date();
    const hasPendingInvite = await this.prisma.businessInvite.count({
      where: {
        email: normalizedEmail,
        status: BusinessInviteStatus.PENDING,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    if (hasPendingInvite > 0) {
      return { allowed: true, reason: "invite" as AuthAccessReason };
    }

    if (!isWorkEmail(normalizedEmail)) {
      return { allowed: false, reason: "personal_email" as AuthAccessReason };
    }

    return { allowed: true, reason: "business_email" as AuthAccessReason };
  }

  async validateAuthenticatedUser(payload: AuthUser): Promise<AuthUser> {
    const email = normalizeEmail(payload.email ?? "");
    if (!email) {
      throw new UnauthorizedException("Email is required");
    }

    return { sub: payload.sub, email };
  }

  async acceptInvite(user: AuthUser, businessId?: string) {
    const email = normalizeEmail(user.email);
    await this.ensureProfile(user.sub, email);
    return this.acceptPendingInvites(user.sub, email, businessId);
  }

  private async ensureProfile(id: string, email: string) {
    const existing = await this.prisma.profile.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      await this.prisma.profile.update({
        where: { id: existing.id },
        data: { id },
      });
      return;
    }

    await this.prisma.profile.upsert({
      where: { id },
      update: { email },
      create: { id, email },
    });
  }

  private async acceptPendingInvites(
    profileId: string,
    email: string,
    businessId?: string,
  ) {
    const now = new Date();
    const invites = await this.prisma.businessInvite.findMany({
      where: {
        email,
        status: BusinessInviteStatus.PENDING,
        ...(businessId ? { businessId } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        businessId: true,
        role: true,
      },
    });

    if (invites.length === 0) {
      return [];
    }

    await this.prisma.$transaction(
      invites.map((invite) =>
        this.prisma.businessMember.upsert({
          where: {
            businessId_profileId: {
              businessId: invite.businessId,
              profileId,
            },
          },
          update: { role: invite.role },
          create: {
            businessId: invite.businessId,
            profileId,
            role: invite.role,
          },
        }),
      ),
    );

    await this.prisma.businessInvite.updateMany({
      where: {
        id: { in: invites.map((invite) => invite.id) },
      },
      data: {
        status: BusinessInviteStatus.ACCEPTED,
        acceptedAt: now,
        acceptedById: profileId,
      },
    });

    return this.prisma.businessMember.findMany({
      where: {
        profileId,
        businessId: { in: invites.map((invite) => invite.businessId) },
      },
      select: {
        businessId: true,
        profileId: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
