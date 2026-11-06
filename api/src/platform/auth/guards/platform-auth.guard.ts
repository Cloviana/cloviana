import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { IS_PUBLIC_KEY } from "@/platform/auth/decorators/public.decorator";
import type { PlatformAuth } from "@/platform/auth/platform/platform-auth.factory";
import { PLATFORM_AUTH } from "@/platform/auth/platform/platform-auth.token";
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyRequest } from "fastify";

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PLATFORM_AUTH) private readonly auth: PlatformAuth,
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
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    const email = session?.user.email.trim().toLowerCase();
    if (!session || !email) {
      throw new UnauthorizedException();
    }

    request.user = { sub: session.user.id, email };

    return true;
  }
}
