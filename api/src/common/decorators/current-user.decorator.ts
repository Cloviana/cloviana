import type { AuthUser } from "@/interfaces/auth-user.interface";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const CurrentUser = createParamDecorator<AuthUser>(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
