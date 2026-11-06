import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { CompleteOnboardingUseCase } from "@/modules/onboarding/application/complete-onboarding/complete-onboarding.use-case";
import { CompleteOnboardingDto } from "@/modules/onboarding/presentation/http/dto/complete-onboarding.dto";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly completeOnboarding: CompleteOnboardingUseCase) {}

  @Post("complete")
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentUser() user: AuthUser,
    @Body() body: CompleteOnboardingDto,
  ) {
    const result = await this.completeOnboarding.execute({
      userId: user.sub,
      marketplaceName: body.marketplaceName,
    });

    return {
      onboardedAt: result.onboardedAt.toISOString(),
      marketplace: result.marketplace,
    };
  }
}
