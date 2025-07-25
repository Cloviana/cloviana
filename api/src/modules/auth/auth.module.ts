import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guards";
import { SupabaseStrategy } from "./strategies/supabase.strategy";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "supabase" })],
  providers: [SupabaseStrategy, SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
