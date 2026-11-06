export type ThemeStatus = "ACTIVE" | "ARCHIVED";

export interface Theme {
  id: string;
  name: string;
  status: ThemeStatus;
  /** True when the marketplace's published storefront is a deployment of this theme. */
  isLive: boolean;
  thumbnailId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateThemeFromTemplateRecord {
  id: string;
  marketplaceId: string;
  name: string;
  templateKey: string;
  templateVersion: string;
  /** Where the copied template archive already is. */
  storageKey: string;
  /** The template's initial commit, recorded as the first revision. */
  commitSha: string;
  maxThemes: number;
}

export type CreateThemeFromTemplateResult =
  | { theme: Theme }
  | { limitReached: true };
