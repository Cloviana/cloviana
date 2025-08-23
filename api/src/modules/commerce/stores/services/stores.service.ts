import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { AuthUser } from "@/interfaces/auth-user.interface";
import { CreateStoreDto } from "../dto/create-store.dto";
import { resolveFavicon } from "@/utils/resolve-favicon.util";

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
      },
    });

    return store;
  }
}
