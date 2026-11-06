import {
  type ExecutionContext,
  UseGuards,
  applyDecorators,
  createParamDecorator,
} from "@nestjs/common";

import type { Member } from "@/modules/vendors/domain/member";
import { Public } from "@/platform/auth/decorators/public.decorator";
import { VendorAuthGuard, type VendorRequest } from "./vendor-auth.guard";

/** Marks a /vendor route as member-authenticated (skips the platform guard). */
export const VendorRoute = () =>
  applyDecorators(Public(), UseGuards(VendorAuthGuard));

export const CurrentMember = createParamDecorator<unknown, Member>(
  (_, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<VendorRequest>().member as Member,
);
