import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { Injectable } from "@nestjs/common";
import type { ThemeEditorAccess } from "../editor/editor.types";
import { ThemeEditorStore } from "../ports/theme-editor.store";
@Injectable()
export class GetEditorThemeUseCase {
  constructor(
    private readonly marketplaces: GetMarketplaceUseCase,
    private readonly store: ThemeEditorStore,
  ) {}
  async execute(input: ThemeEditorAccess) {
    const marketplace = await this.marketplaces.execute(input);
    return this.store.get(marketplace.id, input.themeId);
  }
}
