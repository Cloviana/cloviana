import { Injectable } from "@nestjs/common";

import type { PlatformUserRepository } from "@/modules/platform-users/application/ports/platform-user.repository.port";
import type { PlatformUser } from "@/modules/platform-users/domain/platform-user";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

@Injectable()
export class PrismaPlatformUserRepository implements PlatformUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PlatformUser | null> {
    return this.prisma.platformUser.findUnique({
      where: { id },
      select: { id: true, email: true, onboardedAt: true },
    });
  }

  async markOnboarded(id: string, at: Date): Promise<void> {
    await this.prisma.platformUser.updateMany({
      where: { id, onboardedAt: null },
      data: { onboardedAt: at },
    });
  }
}
