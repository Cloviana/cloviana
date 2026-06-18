import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const businessId = req.params.businessId as string;
    const user = req.user as AuthUser;

    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        OR: [
          { ownerId: user.sub },
          { members: { some: { profileId: user.sub } } },
        ],
      },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (!business.monitoringEnabled) {
      throw new ForbiddenException("Monitoring is disabled. Please contact support.");
    }

    req.business = business;
    return true;
  }
}
