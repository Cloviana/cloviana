import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AccessStage } from "@prisma/client";

@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const storeId = req.params.storeId as string;

    let store = req.store as any;
    if (!store) {
      store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: {
          id: true,
          stage: true,
          betaUntil: true,
          acceptedAt: true,
        },
      });

      if (!store) {
        throw new NotFoundException("Store not found");
      }

      req.store = store;
    }

    const now = new Date();
    const inBetaWindow = !store.betaUntil || new Date(store.betaUntil) > now;

    const hasBetaAccess =
      store.stage === AccessStage.BETA &&
      !!store.acceptedAt &&
      inBetaWindow;

    const hasActiveAccess = store.stage === AccessStage.ACTIVE;

    if (!hasBetaAccess && !hasActiveAccess) {
      throw new ForbiddenException("Store does not have access");
    }

    return true;
  }
}
