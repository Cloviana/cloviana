import { Controller, Get } from "@nestjs/common";

import { GetMeUseCase } from "@/modules/platform-users/application/get-me/get-me.use-case";
import { MeResponseDto } from "@/modules/platform-users/presentation/http/dto/me.response.dto";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

@Controller("me")
export class MeController {
  constructor(private readonly getMe: GetMeUseCase) {}

  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<MeResponseDto> {
    return MeResponseDto.from(await this.getMe.execute({ userId: user.sub }));
  }
}
