import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CreateStoreDto } from "./dto/create-store.dto";
import { StoresService } from "./stores.service";

@Controller("stores")
export class StoresController {
  constructor(private readonly store: StoresService) {}

  @Get()
  async getStores(@CurrentUser() user: AuthUser) {
    return this.store.getStores(user);
  }

  @Get(":id")
  async getStore(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.store.getStoreById(user, id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createStore(
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.store.createStore(user, dto);
  }
}
