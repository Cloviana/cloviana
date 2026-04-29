import { Public } from "@/common/decorators/public.decorator";
import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Controller, Get, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CheckAuthAccessDto } from "./dto/check-auth-access.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get("access")
  async checkAccess(@Query() query: CheckAuthAccessDto) {
    return this.authService.getAccessByEmail(query.email);
  }

  @Post("invites/accept")
  async acceptInvites(
    @CurrentUser() user: AuthUser,
    @Query("businessId") businessId?: string,
  ) {
    return this.authService.acceptInvite(user, businessId);
  }
}
