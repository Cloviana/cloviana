import { Module } from "@nestjs/common";
import { PlatformAuthGuard } from "./guards/platform-auth.guard";
import { PlatformAuthModule } from "./platform/platform-auth.module";

@Module({
  imports: [PlatformAuthModule],
  providers: [PlatformAuthGuard],
  exports: [PlatformAuthGuard, PlatformAuthModule],
})
export class AuthModule {}
