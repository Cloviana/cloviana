import { PrismaService } from "@/clients/prisma/prisma.service";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { ownerAccessibleBusinessWhere } from "@/modules/businesses/queries/business-where";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class BusinessOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const businessId = req.params.businessId as string;
    const user = req.user as AuthUser;

    const business = await this.prisma.business.findFirst({
      where: ownerAccessibleBusinessWhere(user.sub, businessId),
    });
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    req.business = business;
    return true;
  }
}
