import { CurrentUser } from "@/decorators/current-user.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { SetupClientDto } from "./dto/setup-client.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("generate-password")
  generatePassword(@CurrentUser() user: AuthUser) {
    return this.adminService.generateSecurePassword(user);
  }

  @Post("setup-client")
  setupClient(@CurrentUser() user: AuthUser, @Body() dto: SetupClientDto) {
    return this.adminService.setupClient(user, dto);
  }

  @Get("users")
  listUsers(@CurrentUser() user: AuthUser, @Query("search") search?: string) {
    return this.adminService.listUsers(user, search);
  }

  @Delete("users/:profileId")
  deleteUser(
    @CurrentUser() user: AuthUser,
    @Param("profileId") profileId: string,
  ) {
    return this.adminService.deleteUser(user, profileId);
  }

  @Patch("businesses/:businessId/monitoring")
  toggleMonitoring(
    @CurrentUser() user: AuthUser,
    @Param("businessId") businessId: string,
    @Body("enabled") enabled: boolean,
  ) {
    return this.adminService.toggleMonitoring(user, businessId, enabled);
  }
}
