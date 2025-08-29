import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ChannelsService } from "./channels.service";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { ShopifyConnectDto } from "./dto/connect-shopify.dto";

@Controller("stores/:storeId/channels")
@UseGuards(StoreOwnerGuard)
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Post("shopify/connect")
  async exchange(
    @Body() dto: ShopifyConnectDto,
    @Param("storeId") storeId: string,
  ) {
    return this.channels.connectShopify({ ...dto, storeId });
  }
}
