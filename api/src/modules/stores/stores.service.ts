import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { AuthUser } from "@/interfaces/auth-user.interface";
import { CreateStoreDto } from "./dto/create-store.dto";
import { KeywordsProducer } from "../messaging/producers/keywords.producer";
import { StoreStatus } from "@prisma/client";

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keywordsProducer: KeywordsProducer
  ) {}

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
          include: { plan: true },
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
    const profileUrl = await this.resolveFavicon(domainUrl);

    const store = await this.prisma.store.create({
      data: {
        ownerId,
        name,
        domainUrl,
        profileUrl,
        status: StoreStatus.SETTING_UP,
      },
    });

    this.keywordsProducer.seedKeywords({
      storeId: store.id,
    });

    return store;
  }

  private async resolveFavicon(domain: string): Promise<string> {
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    try {
      const response = await fetch(googleFavicon);
      if (response.ok) {
        return googleFavicon;
      }
    } catch {
      // ignore fetch errors
    }
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  }
}
