import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Store } from "@prisma/client";

export const StoreEntity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Store => {
    const req = ctx.switchToHttp().getRequest();
    return req.store as Store;
  },
);
