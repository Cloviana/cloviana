export const DEFAULT_THEME_NAME = "Default theme";

/** The starter template every new theme is copied from. Bump the version when a new template is published. */
export const TEMPLATE_KEY = "marketplace-default";
export const TEMPLATE_VERSION = "1";

/** A marketplace has one theme for now; raise this to allow more. */
export const MAX_THEMES_PER_MARKETPLACE = 1;

/** Where a theme's code snapshot lives in the private bucket. */
export const themeSnapshotKey = (
  marketplaceId: string,
  themeId: string,
  snapshotVersion: number,
) => `themes/${marketplaceId}/${themeId}/snapshot-${snapshotVersion}.tar.gz`;
