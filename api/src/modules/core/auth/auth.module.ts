import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guards";
import { SupabaseStrategy } from "./strategies/supabase.strategy";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "supabase" })],
  providers: [SupabaseStrategy, SupabaseAuthGuard, AuthService],
  controllers: [AuthController],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
