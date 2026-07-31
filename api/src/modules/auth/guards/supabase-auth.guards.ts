import { SupabaseService } from "@/clients/supabase/supabase.service";
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { AuthService } from "@/modules/auth/auth.service";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthUser }>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException();
    }

    const { data, error } = await this.supabase
      .getAnonClient()
      .auth.getClaims(token);
    const claims = data?.claims;

    if (error || !claims?.sub) {
      this.logger.error(
        `Supabase JWT validation failed: code=${error?.code ?? "missing_claims"} message=${error?.message ?? "Token has no subject claim"}`,
      );
      throw new UnauthorizedException();
    }

    request.user = await this.authService.validateAuthenticatedUser({
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : "",
    });

    return true;
  }
}
