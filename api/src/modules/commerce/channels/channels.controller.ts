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
import { CreateChannelDto } from "./dto/create-channel.dto";

@Controller("stores/:storeId/channels")
@UseGuards(StoreOwnerGuard)
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createChannel(
    @Param("storeId") storeId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channels.createChannel(storeId, dto);
  }
}
