import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { CreateChannelDto } from "./dto/create-channel.dto";

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async createChannel(storeId: string, dto: CreateChannelDto) {
    return await this.prisma.channel.create({
      data: {
        shop: dto.shop,
        config: { offlineAccessToken: dto.offlineAccessToken },
        storeId: storeId,
      },
    });
  }
}
