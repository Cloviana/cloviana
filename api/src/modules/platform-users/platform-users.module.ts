import { Module } from "@nestjs/common";

import { GetMeUseCase } from "./application/get-me/get-me.use-case";
import { MarkOnboardedUseCase } from "./application/mark-onboarded/mark-onboarded.use-case";
import { PLATFORM_USER_REPOSITORY } from "./application/ports/platform-user.repository.port";
import { PrismaPlatformUserRepository } from "./infrastructure/prisma/prisma-platform-user.repository";
import { MeController } from "./presentation/http/me.controller";

@Module({
  controllers: [MeController],
  providers: [
    GetMeUseCase,
    MarkOnboardedUseCase,
    {
      provide: PLATFORM_USER_REPOSITORY,
      useClass: PrismaPlatformUserRepository,
    },
  ],
  exports: [GetMeUseCase, MarkOnboardedUseCase],
})
export class PlatformUsersModule {}
