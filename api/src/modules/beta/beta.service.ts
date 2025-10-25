import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";

@Injectable()
export class BetaService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(token: string) {
    const invite = await this.prisma.betaInvite.findUnique({
      where: { token },
      select: {
        id: true,
        storeId: true,
        invitedAt: true,
        durationDays: true,
        acceptedAt: true,
        revokedAt: true,
        store: { select: { id: true, stage: true, ownerId: true } },
      },
    });
    if (!invite) throw new NotFoundException("Invalid token");
    if (invite.revokedAt) throw new ForbiddenException("Invite revoked");
    const expiresAt = new Date(invite.invitedAt);
    expiresAt.setDate(expiresAt.getDate() + invite.durationDays);
    const now = new Date();
    const expired = now > expiresAt;
    return {
      token,
      storeId: invite.storeId,
      storeStage: invite.store.stage,
      accepted: !!invite.acceptedAt,
      expired,
      expiresAt,
    };
  }

  async accept(token: string, userId: string) {
    const invite = await this.prisma.betaInvite.findUnique({
      where: { token },
      select: {
        id: true,
        storeId: true,
        invitedAt: true,
        durationDays: true,
        acceptedAt: true,
        revokedAt: true,
        store: { select: { id: true, stage: true, ownerId: true, betaUntil: true, acceptedAt: true } },
      },
    });
    if (!invite) throw new NotFoundException("Invalid token");
    if (invite.revokedAt) throw new ForbiddenException("Invite revoked");
    if (invite.store.ownerId !== userId) throw new ForbiddenException("Not store owner");

    const expiresAt = new Date(invite.invitedAt);
    expiresAt.setDate(expiresAt.getDate() + invite.durationDays);
    const now = new Date();
    if (now > expiresAt) throw new ForbiddenException("Invite expired");

    const alreadyAccepted = !!invite.acceptedAt || invite.store.stage === "ACTIVE" || invite.store.stage === "BETA";
    if (alreadyAccepted) {
      return {
        storeId: invite.storeId,
        stage: invite.store.stage,
        betaUntil: invite.store.betaUntil,
        acceptedAt: invite.store.acceptedAt ?? invite.acceptedAt,
        tokenAccepted: !!invite.acceptedAt,
      };
    }

    const betaUntil = new Date();
    betaUntil.setDate(betaUntil.getDate() + invite.durationDays);

    const [store] = await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: invite.storeId },
        data: { stage: "BETA", acceptedAt: now, betaUntil },
        select: { id: true, stage: true, acceptedAt: true, betaUntil: true },
      }),
      this.prisma.betaInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: now },
        select: { id: true },
      }),
    ]);

    return {
      storeId: store.id,
      stage: store.stage,
      acceptedAt: store.acceptedAt,
      betaUntil: store.betaUntil,
    };
  }
}
