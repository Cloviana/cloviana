import { AppConfiguration } from "@/config/app.configuration";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

// ponytail: plain shared-secret compare; internal docker network only
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: AppConfiguration) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = req.headers["x-internal-token"];
    const expected = this.config.agentInternalToken;

    if (!expected || token !== expected) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
