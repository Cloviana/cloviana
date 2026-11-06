import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";

import {
  THEME_SNAPSHOT_STORAGE,
  type ThemeSnapshotStorage,
} from "@/modules/themes/application/ports/theme-snapshot.storage.port";
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from "@/modules/themes/application/ports/theme.repository.port";
import type { Theme } from "@/modules/themes/domain/theme";
import {
  DEFAULT_THEME_NAME,
  MAX_THEMES_PER_MARKETPLACE,
  TEMPLATE_KEY,
  TEMPLATE_VERSION,
  themeSnapshotKey,
} from "@/modules/themes/domain/theme-defaults";

export interface ProvisionDefaultThemeInput {
  marketplaceId: string;
  name?: string;
}

export interface ProvisionDefaultThemeResult {
  theme: Theme;
  /** False when the marketplace already had its theme, which is returned unchanged. */
  created: boolean;
}

/**
 * Gives a marketplace its theme: copies the starter template to a private snapshot, then records
 * the theme and its first revision in one transaction. Safe to call again.
 */
@Injectable()
export class ProvisionDefaultThemeUseCase {
  private readonly logger = new Logger(ProvisionDefaultThemeUseCase.name);

  constructor(
    @Inject(THEME_REPOSITORY) private readonly themes: ThemeRepository,
    @Inject(THEME_SNAPSHOT_STORAGE)
    private readonly storage: ThemeSnapshotStorage,
  ) {}

  async execute(
    input: ProvisionDefaultThemeInput,
  ): Promise<ProvisionDefaultThemeResult> {
    const existing = await this.themes.findAll(input.marketplaceId);
    if (existing.length >= MAX_THEMES_PER_MARKETPLACE) {
      return { theme: existing[0], created: false };
    }

    const manifest = await this.storage.readTemplateManifest(
      TEMPLATE_KEY,
      TEMPLATE_VERSION,
    );
    const themeId = randomUUID();
    const storageKey = themeSnapshotKey(input.marketplaceId, themeId, 1);
    await this.storage.copyTemplate(TEMPLATE_KEY, TEMPLATE_VERSION, storageKey);

    // From here the copy is orphaned unless the database accepts the theme, so every other
    // outcome removes it. A crash right here costs one stray file, never a half-made theme.
    try {
      const result = await this.themes.createFromTemplate({
        id: themeId,
        marketplaceId: input.marketplaceId,
        name: input.name ?? DEFAULT_THEME_NAME,
        templateKey: TEMPLATE_KEY,
        templateVersion: TEMPLATE_VERSION,
        storageKey,
        commitSha: manifest.commitSha,
        maxThemes: MAX_THEMES_PER_MARKETPLACE,
      });
      if ("theme" in result) {
        return { theme: result.theme, created: true };
      }

      // Lost a race with another request that created the theme first.
      await this.discardSnapshot(storageKey);
      const [theme] = await this.themes.findAll(input.marketplaceId);
      return { theme, created: false };
    } catch (error) {
      await this.discardSnapshot(storageKey);
      throw error;
    }
  }

  private async discardSnapshot(storageKey: string) {
    try {
      await this.storage.remove(storageKey);
    } catch (error) {
      this.logger.warn(
        `Could not remove unused snapshot ${storageKey}: ${String(error)}`,
      );
    }
  }
}
