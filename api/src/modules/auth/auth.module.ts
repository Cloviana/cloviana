import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guards";
import { SupabaseStrategy } from "./strategies/supabase.strategy";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "supabase" })],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy, SupabaseAuthGuard],
  exports: [AuthService, SupabaseAuthGuard],
})
export class AuthModule {}
