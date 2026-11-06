import { Inject, Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from "@/modules/themes/application/ports/theme.repository.port";
import type { Theme } from "@/modules/themes/domain/theme";

export interface ListThemesInput {
  ownerId: string;
  slug: string;
}

@Injectable()
export class ListThemesUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(THEME_REPOSITORY) private readonly themes: ThemeRepository,
  ) {}

  async execute(input: ListThemesInput): Promise<Theme[]> {
    const marketplace = await this.getMarketplace.execute(input);
    return this.themes.findAll(marketplace.id);
  }
}
