import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BusinessMembershipRole } from "@prisma/client";

@Injectable()
export class BusinessOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { businessId: string };
      user: AuthUser;
    }>();
    const { businessId } = request.params;

    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        OR: [
          { ownerId: request.user.sub },
          {
            members: {
              some: {
                profileId: request.user.sub,
                role: BusinessMembershipRole.OWNER,
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return true;
  }
}
