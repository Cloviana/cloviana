import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AutopilotService } from "./autopilot.service";
import { UpdateAutopilotDto } from "./dtos/update-autopilot.dto";

@Controller("stores/:storeId/autopilot")
@UseGuards(StoreOwnerGuard)
export class AutopilotController {
  constructor(private readonly autopilot: AutopilotService) {}

  @Get()
  async getSettings(@Param("storeId") storeId: string) {
    return this.autopilot.getSettings(storeId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Param("storeId") storeId: string,
    @Body() dto: UpdateAutopilotDto,
  ) {
    return this.autopilot.updateSettings(storeId, dto);
  }
}
