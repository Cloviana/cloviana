import { ResourceNotFoundError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from "@/modules/themes/application/ports/theme.repository.port";
import type { Theme } from "@/modules/themes/domain/theme";

export interface RenameThemeInput {
  ownerId: string;
  slug: string;
  themeId: string;
  name: string;
}

@Injectable()
export class RenameThemeUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(THEME_REPOSITORY) private readonly themes: ThemeRepository,
  ) {}

  async execute(input: RenameThemeInput): Promise<Theme> {
    const marketplace = await this.getMarketplace.execute({
      ownerId: input.ownerId,
      slug: input.slug,
    });
    const theme = await this.themes.rename(
      marketplace.id,
      input.themeId,
      input.name,
    );
    if (!theme) {
      throw new ResourceNotFoundError("Theme not found");
    }
    return theme;
  }
}
