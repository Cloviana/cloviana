import { StateConflictError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { ProvisionDefaultThemeUseCase } from "@/modules/themes/application/provision-default-theme/provision-default-theme.use-case";
import type { Theme } from "@/modules/themes/domain/theme";

export interface CreateThemeInput {
  ownerId: string;
  slug: string;
  name?: string;
}

@Injectable()
export class CreateThemeUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    private readonly provisionTheme: ProvisionDefaultThemeUseCase,
  ) {}

  async execute(input: CreateThemeInput): Promise<Theme> {
    const marketplace = await this.getMarketplace.execute({
      ownerId: input.ownerId,
      slug: input.slug,
    });
    const { theme, created } = await this.provisionTheme.execute({
      marketplaceId: marketplace.id,
      name: input.name,
    });
    if (!created) {
      throw new StateConflictError("This marketplace already has a theme.");
    }
    return theme;
  }
}
