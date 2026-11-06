import type {
  CreateThemeFromTemplateRecord,
  CreateThemeFromTemplateResult,
  Theme,
} from "../../domain/theme";

export const THEME_REPOSITORY = Symbol("THEME_REPOSITORY");

export interface ThemeRepository {
  /** The marketplace's active themes, newest first. */
  findAll(marketplaceId: string): Promise<Theme[]>;
  /** Null when the theme is not an active theme of this marketplace. */
  rename(
    marketplaceId: string,
    themeId: string,
    name: string,
  ): Promise<Theme | null>;
  /**
   * Adds the theme and its first revision, unless the marketplace is already at `maxThemes`.
   * Concurrent calls for one marketplace run one at a time, so the limit cannot be exceeded.
   */
  createFromTemplate(
    input: CreateThemeFromTemplateRecord,
  ): Promise<CreateThemeFromTemplateResult>;
}
