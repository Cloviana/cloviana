import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type {
  AcceptInviteRecord,
  MemberRepository,
} from "@/modules/vendors/application/ports/member.repository.port";
import type { Member } from "@/modules/vendors/domain/member";
import type { MemberInvite } from "@/modules/vendors/domain/member-invite";
import { TenantPrismaService } from "@/platform/tenancy/tenant-prisma.service";

const memberInclude = {
  sellerMembers: { select: { sellerId: true, roleId: true, isOwner: true } },
} satisfies Prisma.MemberInclude;

type MemberRow = Prisma.MemberGetPayload<{ include: typeof memberInclude }>;

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    marketplaceId: row.marketplaceId,
    marketplaceUserId: row.marketplaceUserId,
    email: row.email,
    isActive: row.isActive,
    sellers: row.sellerMembers,
  };
}

@Injectable()
export class PrismaMemberRepository implements MemberRepository {
  constructor(private readonly tenant: TenantPrismaService) {}

  async findByMarketplaceUser(
    marketplaceId: string,
    marketplaceUserId: string,
  ): Promise<Member | null> {
    const row = await this.tenant.run(marketplaceId, (tx) =>
      tx.member.findFirst({
        where: { marketplaceId, marketplaceUserId },
        include: memberInclude,
      }),
    );
    return row ? toMember(row) : null;
  }

  findInviteByTokenHash(
    marketplaceId: string,
    tokenHash: string,
  ): Promise<MemberInvite | null> {
    return this.tenant.run(marketplaceId, (tx) =>
      tx.memberInvite.findFirst({ where: { marketplaceId, tokenHash } }),
    );
  }

  acceptInvite(input: AcceptInviteRecord): Promise<Member | null> {
    const { marketplaceId, invite, marketplaceUserId } = input;

    return this.tenant.run(marketplaceId, async (tx) => {
      // Compare-and-set: only one concurrent request can flip acceptedAt from null.
      const claimed = await tx.memberInvite.updateMany({
        where: { id: invite.id, marketplaceId, acceptedAt: null },
        data: { acceptedAt: input.now },
      });
      if (claimed.count === 0) {
        return null;
      }

      await tx.member.createMany({
        data: [
          {
            marketplaceId,
            marketplaceUserId,
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
          },
        ],
        skipDuplicates: true,
      });
      const member = await tx.member.findFirstOrThrow({
        where: { marketplaceId, marketplaceUserId },
      });

      await tx.sellerMember.createMany({
        data: [
          {
            marketplaceId,
            sellerId: invite.sellerId,
            memberId: member.id,
            roleId: invite.roleId,
            isOwner: invite.isOwner,
          },
        ],
        skipDuplicates: true,
      });

      // The store becomes active once its owner has joined. A store suspended in the meantime stays suspended.
      if (invite.isOwner) {
        await tx.seller.updateMany({
          where: { id: invite.sellerId, marketplaceId, status: "PENDING" },
          data: { status: "ACTIVE" },
        });
      }

      return toMember(
        await tx.member.findFirstOrThrow({
          where: { id: member.id, marketplaceId },
          include: memberInclude,
        }),
      );
    });
  }
}
