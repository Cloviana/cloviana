import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { DEFAULT_SELLER_ROLE_NAME } from "@/modules/marketplaces/application/marketplace-role-contract";
import type { SellerRepository } from "@/modules/vendors/application/ports/seller.repository.port";
import type {
  AdminInviteStatus,
  NewOwnerInvite,
  NewSeller,
  Seller,
  SellerChanges,
  SellerListInput,
  SellerPage,
} from "@/modules/vendors/domain/seller";
import { SellerHandleConflictError } from "@/modules/vendors/domain/seller.errors";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

const sellerSelect = {
  id: true,
  name: true,
  handle: true,
  logo: true,
  currencyCode: true,
  email: true,
  phone: true,
  status: true,
  isPremium: true,
  createdAt: true,
  invites: {
    where: { isOwner: true },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { email: true, acceptedAt: true, expiresAt: true },
  },
} satisfies Prisma.SellerSelect;

type SellerRow = Prisma.SellerGetPayload<{ select: typeof sellerSelect }>;

function inviteStatus(
  invite: SellerRow["invites"][number],
  now: Date,
): AdminInviteStatus {
  if (invite.acceptedAt) {
    return "accepted";
  }
  return invite.expiresAt <= now ? "expired" : "pending";
}

function toSeller(row: SellerRow): Seller {
  const { invites, isPremium, ...rest } = row;
  const invite = invites[0];
  return {
    ...rest,
    currencyCode: row.currencyCode.toUpperCase(),
    featured: isPremium,
    adminInvite: invite
      ? { email: invite.email, status: inviteStatus(invite, new Date()) }
      : null,
  };
}

@Injectable()
export class PrismaSellerRepository implements SellerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    marketplaceId: string,
    input: SellerListInput,
  ): Promise<SellerPage> {
    const where: Prisma.SellerWhereInput = {
      marketplaceId,
      ...(input.status === "ALL" ? {} : { status: input.status }),
      ...(input.search
        ? {
            OR: [
              {
                name: { contains: input.search, mode: "insensitive" as const },
              },
              {
                handle: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        select: sellerSelect,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: input.offset,
        take: input.limit + 1,
      }),
      this.prisma.seller.count({ where }),
    ]);

    return {
      items: rows.slice(0, input.limit).map(toSeller),
      nextOffset: rows.length > input.limit ? input.offset + input.limit : null,
      total,
    };
  }

  createWithOwnerInvite(
    seller: NewSeller,
    invite: NewOwnerInvite,
  ): Promise<Seller> {
    const { marketplaceId } = seller;

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirstOrThrow({
        where: { marketplaceId, name: DEFAULT_SELLER_ROLE_NAME },
        select: { id: true },
      });
      const created = await tx.seller
        .create({
          data: seller,
          select: { id: true },
        })
        .catch((error: unknown) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            throw new SellerHandleConflictError();
          }
          throw error;
        });
      await tx.memberInvite.create({
        data: {
          marketplaceId,
          sellerId: created.id,
          roleId: role.id,
          isOwner: true,
          ...invite,
        },
      });
      return toSeller(
        await tx.seller.findFirstOrThrow({
          where: { id: created.id, marketplaceId },
          select: sellerSelect,
        }),
      );
    });
  }

  replaceOwnerInvite(
    marketplaceId: string,
    sellerId: string,
    invite: NewOwnerInvite,
    now: Date,
  ): Promise<Seller | null> {
    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.findFirst({
        where: { id: sellerId, marketplaceId },
        select: { id: true },
      });
      if (!seller) {
        return null;
      }

      const role = await tx.role.findFirstOrThrow({
        where: { marketplaceId, name: DEFAULT_SELLER_ROLE_NAME },
        select: { id: true },
      });
      await tx.memberInvite.updateMany({
        where: { marketplaceId, sellerId, isOwner: true, acceptedAt: null },
        data: { expiresAt: now },
      });
      await tx.memberInvite.create({
        data: {
          marketplaceId,
          sellerId,
          roleId: role.id,
          isOwner: true,
          ...invite,
        },
      });
      return toSeller(
        await tx.seller.findFirstOrThrow({
          where: { id: sellerId, marketplaceId },
          select: sellerSelect,
        }),
      );
    });
  }

  async hasOwner(marketplaceId: string, sellerId: string): Promise<boolean> {
    const owner = await this.prisma.sellerMember.findFirst({
      where: { marketplaceId, sellerId, isOwner: true },
      select: { id: true },
    });
    return owner !== null;
  }

  async updateMany(
    marketplaceId: string,
    ids: string[],
    changes: SellerChanges,
  ): Promise<number> {
    const { count } = await this.prisma.seller.updateMany({
      where: { marketplaceId, id: { in: ids }, status: { not: "TERMINATED" } },
      data: {
        ...(changes.status ? { status: changes.status } : {}),
        ...(changes.featured === undefined
          ? {}
          : { isPremium: changes.featured }),
      },
    });
    return count;
  }
}
