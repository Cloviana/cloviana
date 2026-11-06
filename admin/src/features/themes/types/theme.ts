export type ThemeStatus = 'ACTIVE' | 'ARCHIVED';

export interface Theme {
  id: string;
  name: string;
  status: ThemeStatus;
  /** True when the published storefront is a deployment of this theme. */
  isLive: boolean;
  thumbnailId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeVersion {
  id: string;
  number: number;
  label: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type ThemeActionResult<T = object> =
  | ({ success: true } & T)
  | { success: false; message: string };
