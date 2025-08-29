import { Controller, Post, Body, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { Public } from "@/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { ShopifyExchangeDto } from "./dtos/shopify-exchange.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("shopify/exchange")
  @Public()
  async exchange(@Body() dto: ShopifyExchangeDto) {
    return this.auth.exchangeAndIssueSession(dto);
  }
}
