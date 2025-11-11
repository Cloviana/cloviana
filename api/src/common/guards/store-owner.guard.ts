import { PrismaService } from "@/clients/prisma/prisma.service";
import { AuthUser } from "@/interfaces/auth-user.interface";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const storeId = req.params.storeId as string;
    const user = req.user as AuthUser;

    const store = await this.prisma.store.findUnique({
      where: { id: storeId, ownerId: user.sub },
    });
    if (!store) {
      throw new NotFoundException("Store not found");
    }

    // stash it on the request so downstream handlers can use it
    req.store = store;
    return true;
  }
}
