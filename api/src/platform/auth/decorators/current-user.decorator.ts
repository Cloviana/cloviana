import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const CurrentUser = createParamDecorator<AuthUser>(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
