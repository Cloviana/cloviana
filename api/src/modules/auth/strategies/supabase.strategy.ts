import { AppConfiguration } from "@/config/app.configuration";
import { AuthService } from "@/modules/auth/auth.service";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, "supabase") {
  constructor(
    private readonly config: AppConfiguration,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.supabaseJwtSecret,
    });
  }

  async validate(payload: any) {
    return this.authService.validateAuthenticatedUser(payload);
  }
}
