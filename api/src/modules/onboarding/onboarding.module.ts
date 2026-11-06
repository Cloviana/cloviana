import { Module } from "@nestjs/common";

import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";
import { PlatformUsersModule } from "@/modules/platform-users/platform-users.module";
import { ThemesModule } from "@/modules/themes/themes.module";

import { CompleteOnboardingUseCase } from "./application/complete-onboarding/complete-onboarding.use-case";
import { OnboardingController } from "./presentation/http/onboarding.controller";

@Module({
  imports: [MarketplacesModule, PlatformUsersModule, ThemesModule],
  controllers: [OnboardingController],
  providers: [CompleteOnboardingUseCase],
})
export class OnboardingModule {}
