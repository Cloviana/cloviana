import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guards";
import { SupabaseStrategy } from "./strategies/supabase.strategy";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "supabase" })],
  providers: [SupabaseStrategy, SupabaseAuthGuard, AuthService],
  controllers: [AuthController],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
