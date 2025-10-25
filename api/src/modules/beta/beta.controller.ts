import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { BetaService } from "./beta.service";
import { AcceptBetaDto } from "./dtos/accept-beta.dto";
import { ValidateTokenDto } from "./dtos/validate-token.dto";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { CurrentUser } from "@/decorators/current-user.decorator";

@Controller("beta")
export class BetaController {
  constructor(private readonly beta: BetaService) {}

  @Get("validate")
  validate(@Query() dto: ValidateTokenDto) {
    return this.beta.validate(dto.token);
  }

  @Post("accept")
  accept(@Body() dto: AcceptBetaDto, @CurrentUser() user: AuthUser) {
    return this.beta.accept(dto.token, user.sub);
  }
}
