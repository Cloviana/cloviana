import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { StoresProducer } from "@/modules/integrations/messaging/producers/stores.producer";

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storesProducer: StoresProducer,
  ) {}

  async createChannel(storeId: string, dto: CreateChannelDto) {
    const channel = await this.prisma.channel.create({
      data: {
        shop: dto.shop,
        config: { offlineAccessToken: dto.offlineAccessToken },
        storeId,
      },
    });

    await this.storesProducer.init({ storeId });
    this.logger.log(`Channel created and init emitted for storeId=${storeId}`);
    return channel;
  }
}
