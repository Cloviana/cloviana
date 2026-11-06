import { Injectable, Logger } from "@nestjs/common";

import { CreateMarketplaceUseCase } from "@/modules/marketplaces/application/create-marketplace/create-marketplace.use-case";
import { ListMarketplacesUseCase } from "@/modules/marketplaces/application/list-marketplaces/list-marketplaces.use-case";
import { GetMeUseCase } from "@/modules/platform-users/application/get-me/get-me.use-case";
import { MarkOnboardedUseCase } from "@/modules/platform-users/application/mark-onboarded/mark-onboarded.use-case";
import { ProvisionDefaultThemeUseCase } from "@/modules/themes/application/provision-default-theme/provision-default-theme.use-case";

export interface CompleteOnboardingInput {
  userId: string;
  /** Omitted when the user skips creating a marketplace. */
  marketplaceName?: string;
}

export interface OnboardingMarketplace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

export interface CompleteOnboardingResult {
  onboardedAt: Date;
  marketplace: OnboardingMarketplace | null;
}

@Injectable()
export class CompleteOnboardingUseCase {
  private readonly logger = new Logger(CompleteOnboardingUseCase.name);

  constructor(
    private readonly getMe: GetMeUseCase,
    private readonly markOnboarded: MarkOnboardedUseCase,
    private readonly createMarketplace: CreateMarketplaceUseCase,
    private readonly listMarketplaces: ListMarketplacesUseCase,
    private readonly provisionTheme: ProvisionDefaultThemeUseCase,
  ) {}

  async execute(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult> {
    const user = await this.getMe.execute({ userId: input.userId });
    if (user.onboardedAt) {
      return { onboardedAt: user.onboardedAt, marketplace: null };
    }

    // Create first, flag second: if the flag write fails, a retry reuses the
    // marketplace instead of creating another.
    let marketplace: OnboardingMarketplace | null = null;
    if (input.marketplaceName) {
      const [existing] = await this.listMarketplaces.execute({
        ownerId: input.userId,
      });
      marketplace =
        existing ??
        (await this.createMarketplace.execute({
          name: input.marketplaceName,
          ownerId: input.userId,
        }));
    }

    if (marketplace) {
      await this.provisionThemeBestEffort(marketplace.id);
    }

    const onboardedAt = await this.markOnboarded.execute({
      userId: input.userId,
    });

    return { onboardedAt, marketplace };
  }

  // A storage outage must not block signup. The Themes page offers to create the theme instead.
  private async provisionThemeBestEffort(marketplaceId: string) {
    try {
      await this.provisionTheme.execute({ marketplaceId });
    } catch (error) {
      this.logger.warn(
        `Could not create the default theme for marketplace ${marketplaceId}: ${String(error)}`,
      );
    }
  }
}
