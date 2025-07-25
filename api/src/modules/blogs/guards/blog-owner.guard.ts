import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { AuthUser } from "@/interfaces/auth-user.interface";

@Injectable()
export class BlogOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const id = req.params.blogId as string;
    const user = req.user as AuthUser;

    const blog = await this.prisma.blog.findUnique({
      where: { id },
      select: { store: { select: { ownerId: true } }, id: true, storeId: true },
    });

    if (!blog || blog.store.ownerId !== user.sub) {
      throw new NotFoundException("Blog not found");
    }

    req.blog = blog;
    return true;
  }
}
