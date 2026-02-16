import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { AuthUser } from "@/interfaces/auth-user.interface";
import { resolveFavicon } from "@/utils/resolve-favicon.util";
import { DayOfWeek } from "@prisma/client";
import { CreateStoreDto } from "../dto/create-store.dto";

const DOW: DayOfWeek[] = [
  DayOfWeek.SUN,
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
];

function tomorrowDayOfWeek(date = new Date()): DayOfWeek {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return DOW[d.getDay()];
}

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getStores(user: AuthUser) {
    const { sub: ownerId } = user;
    return this.prisma.store.findMany({
      where: { ownerId },
    });
  }

  async getStoreById(user: AuthUser, storeId: string) {
    const { sub: ownerId } = user;
    return this.prisma.store.findFirst({
      where: { id: storeId, ownerId },
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
        channel: {
          select: {
            id: true,
            shop: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async createStore(user: AuthUser, dto: CreateStoreDto) {
    const { name, domainUrl } = dto;
    const { sub: ownerId } = user;
    const profileUrl = await resolveFavicon(domainUrl);

    const store = await this.prisma.store.create({
      data: {
        ownerId,
        name,
        domainUrl,
        profileUrl,
        autopilotSettings: {
          create: {
            blog: {
              create: {
                publishDays: [tomorrowDayOfWeek()],
              },
            },
          },
        },
      },
    });

    return store;
  }

  async getStoreStatus(user: AuthUser, storeId: string) {
    const { sub: ownerId } = user;
    const store = await this.prisma.store.findFirstOrThrow({
      where: { id: storeId, ownerId },
      select: { id: true, status: true, updatedAt: true },
    });
    return {
      storeId: store.id,
      status: store.status,
      lastUpdated: store.updatedAt,
    };
  }
}
