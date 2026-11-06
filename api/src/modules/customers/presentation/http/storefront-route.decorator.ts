import { UseGuards, applyDecorators } from "@nestjs/common";

import { Public } from "@/platform/auth/decorators/public.decorator";
import { StorefrontAuthGuard } from "./storefront-auth.guard";

/** Marks a /storefront route as shopper-authenticated (skips the platform guard). */
export const StorefrontRoute = () =>
  applyDecorators(Public(), UseGuards(StorefrontAuthGuard));
